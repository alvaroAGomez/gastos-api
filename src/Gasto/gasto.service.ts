import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gasto } from './gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { GastoResponseDto } from './dto/gasto-response.dto';
import { CategoriaGasto } from 'src/Categoria/categoria.entity';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { TarjetaDebito } from 'src/TarjetaDebito/tarjeta-debito.entity';
import { Usuario } from 'src/Usuario/usuario.entity';
import { CuotaService } from 'src/Cuota/cuota.service';
import { GastoTarjetaFiltroDto } from './dto/gasto-tarjeta-filtro.dto';

@Injectable()
export class GastoService {
  constructor(
    @InjectRepository(Gasto) private gastoRepo: Repository<Gasto>,
    @InjectRepository(CategoriaGasto) private categoriaRepo: Repository<CategoriaGasto>,
    @InjectRepository(TarjetaCredito) private creditoRepo: Repository<TarjetaCredito>,
    @InjectRepository(TarjetaDebito) private debitoRepo: Repository<TarjetaDebito>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    private readonly cuotaService: CuotaService
  ) {}

  async create(dto: CreateGastoDto, userId: number): Promise<GastoResponseDto> {
    // Validación: no se puede asociar a ambas tarjetas
    if (dto.tarjetaCreditoId && dto.tarjetaDebitoId) {
      throw new BadRequestException('No se puede asociar un gasto a tarjeta de crédito y débito al mismo tiempo.');
    }

    const gasto = new Gasto();

    gasto.usuario = await this.usuarioRepo.findOneByOrFail({ id: userId });
    gasto.categoria = await this.categoriaRepo.findOneByOrFail({ id: dto.categoriaGastoId });

    if (dto.tarjetaCreditoId) {
      gasto.tarjetaCredito = await this.creditoRepo.findOneByOrFail({ id: dto.tarjetaCreditoId });
      gasto.esEnCuotas = true;
      gasto.totalCuotas = dto.numeroCuotas && dto.numeroCuotas > 1 ? dto.numeroCuotas : 1;
    }

    if (dto.tarjetaDebitoId) {
      gasto.tarjetaDebito = await this.debitoRepo.findOneByOrFail({ id: dto.tarjetaDebitoId });
      gasto.esEnCuotas = false;
      gasto.totalCuotas = 0;
    }

    gasto.monto = dto.monto;
    gasto.fecha = new Date(dto.fecha);
    gasto.descripcion = dto.descripcion ?? '';

    const savedGasto = await this.gastoRepo.save(gasto);

    if (gasto.tarjetaCredito && gasto.totalCuotas > 0) {
      await this.cuotaService.generarCuotas(savedGasto);
    }

    return this.mapToResponseDto(savedGasto);
  }

  async findAll(userId: number): Promise<GastoResponseDto[]> {
    const gastos = await this.gastoRepo.find({
      where: { usuario: { id: userId } },
      relations: ['categoria'],
      order: { fecha: 'DESC' },
    });

    return gastos.map(this.mapToResponseDto);
  }

  async findOne(id: number, userId: number): Promise<GastoResponseDto> {
    const gasto = await this.gastoRepo.findOne({
      where: { id, usuario: { id: userId } },
      relations: ['categoria'],
    });

    if (!gasto) throw new NotFoundException('Gasto no encontrado');

    return this.mapToResponseDto(gasto);
  }

  async update(id: number, dto: UpdateGastoDto, userId: number): Promise<GastoResponseDto> {
    const gasto = await this.gastoRepo.findOne({
      where: { id, usuario: { id: userId } },
      relations: ['categoria', 'tarjetaCredito', 'tarjetaDebito'],
    });

    if (!gasto) throw new NotFoundException('Gasto no encontrado');

    // Validación: no se puede tener ambas tarjetas
    if (dto.tarjetaCreditoId && dto.tarjetaDebitoId) {
      throw new BadRequestException('No se puede asociar un gasto a tarjeta de crédito y débito al mismo tiempo.');
    }

    if (dto.categoriaGastoId) {
      gasto.categoria = await this.categoriaRepo.findOneByOrFail({ id: dto.categoriaGastoId });
    }

    if (dto.tarjetaCreditoId !== undefined) {
      gasto.tarjetaCredito = dto.tarjetaCreditoId
        ? await this.creditoRepo.findOneByOrFail({ id: dto.tarjetaCreditoId })
        : null;
    }

    if (dto.tarjetaDebitoId !== undefined) {
      gasto.tarjetaDebito = dto.tarjetaDebitoId
        ? await this.debitoRepo.findOneByOrFail({ id: dto.tarjetaDebitoId })
        : null;
    }

    gasto.monto = dto.monto ?? gasto.monto;
    gasto.fecha = dto.fecha ? new Date(dto.fecha) : gasto.fecha;
    gasto.descripcion = dto.descripcion ?? gasto.descripcion;

    // Reglas para cuotas
    if (gasto.tarjetaCredito) {
      gasto.esEnCuotas = true;
      gasto.totalCuotas = dto.numeroCuotas && dto.numeroCuotas > 1 ? dto.numeroCuotas : 1;
    } else {
      gasto.esEnCuotas = false;
      gasto.totalCuotas = 0;
    }

    await this.cuotaService.eliminarCuotasPorGasto(gasto.id);
    const updated = await this.gastoRepo.save(gasto);

    if (gasto.tarjetaCredito && gasto.totalCuotas > 0) {
      await this.cuotaService.generarCuotas(updated);
    }

    return this.mapToResponseDto(updated);
  }

  async remove(id: number, userId: number): Promise<void> {
    const gasto = await this.gastoRepo.findOne({
      where: { id, usuario: { id: userId } },
    });

    if (!gasto) throw new NotFoundException();

    await this.cuotaService.eliminarCuotasPorGasto(gasto.id);
    await this.gastoRepo.delete(id);
  }

  async gastosPorTarjeta(tarjetaId: number, usuarioId: number, filtros: GastoTarjetaFiltroDto) {
    const {
      page = 1,
      limit = 10,
      fechaDesde,
      fechaHasta,
      categoria,
      cuotasRestantes,
      sortField = 'fecha',
      sortDirection = 'DESC',
    } = filtros;

    const query = this.gastoRepo
      .createQueryBuilder('gasto')
      .leftJoinAndSelect('gasto.categoria', 'categoria')
      .where('gasto.tarjetaCredito = :tarjetaId', { tarjetaId })
      .andWhere('gasto.usuarioId = :usuarioId', { usuarioId });

    if (fechaDesde != '' && fechaDesde != null) query.andWhere('gasto.fecha >= :fechaDesde', { fechaDesde });
    if (fechaHasta != '' && fechaHasta != null) query.andWhere('gasto.fecha <= :fechaHasta', { fechaHasta });

    // Cambia aquí: solo filtra por categoría si no es "Todas" ni vacío
    if (categoria && categoria !== 'Todas') {
      query.andWhere('gasto.categoria = :categoriaId', { categoriaId: categoria });
    }

    query.orderBy(`gasto.${sortField}`, sortDirection as any);

    // Traer todos los gastos para calcular cuotas restantes en memoria
    const allData = await query.getMany();

    // Calcular cuotasRestantes para cada gasto
    const now = new Date();
    const gastosConCuotas = allData.map((gasto) => {
      let cuotasRestantes = 0;
      if (gasto.esEnCuotas && gasto.totalCuotas && gasto.fecha) {
        const fechaGasto = new Date(gasto.fecha);
        const mesesTranscurridos =
          (now.getFullYear() - fechaGasto.getFullYear()) * 12 + (now.getMonth() - fechaGasto.getMonth());
        cuotasRestantes = Math.max(gasto.totalCuotas - mesesTranscurridos, 0);
      }
      return {
        ...this.mapToResponseDto(gasto),
        cuotasRestantes,
      };
    });

    // Filtrar por cuotasRestantes si corresponde
    let filtered = gastosConCuotas;
    if (cuotasRestantes !== undefined && cuotasRestantes !== null && !isNaN(Number(cuotasRestantes))) {
      filtered = gastosConCuotas.filter((g) => g.cuotasRestantes === Number(cuotasRestantes));
    }

    // Paginación manual después del filtro
    const start = (page - 1) * limit;
    const end = start + limit;
    const paged = filtered.slice(start, end);

    return { data: paged, total: filtered.length };
  }

  private mapToResponseDto = (gasto: Gasto): any => ({
    id: gasto.id,
    monto: gasto.monto,
    fecha: gasto.fecha,
    descripcion: gasto.descripcion,
    categoria: gasto.categoria?.nombre ?? '',
    cuotas: gasto.totalCuotas,
    cuotasRestantes: undefined,
    cardId: gasto.tarjetaCredito?.id?.toString() ?? '',
    nameCard: gasto.tarjetaCredito?.nombreTarjeta ?? '',
  });
}
