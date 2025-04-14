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

  private mapToResponseDto = (gasto: Gasto): GastoResponseDto => ({
    id: gasto.id,
    monto: gasto.monto,
    fecha: gasto.fecha,
    descripcion: gasto.descripcion,
    esEnCuotas: gasto.esEnCuotas,
    numeroCuotas: gasto.totalCuotas,
    nombreCategoria: gasto.categoria?.nombre ?? '',
  });
}
