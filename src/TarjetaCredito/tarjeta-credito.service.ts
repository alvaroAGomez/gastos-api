import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarjetaCredito } from './tarjeta-credito.entity';
import { CreateTarjetaCreditoDto } from './dto/create-tarjeta-credito.dto';
import { Usuario } from 'src/Usuario/usuario.entity';
import { Banco } from 'src/Banco/banco.entity';
import { UpdateTarjetaCreditoDto } from './dto/update-tarjeta-credito.dto';
import { TarjetaCreditoDetalleDto } from './dto/tarjeta-credito-detalle.dto';
import { Cuota } from 'src/Cuota/cuota.entity';
import { TarjetaCreditoResumenDto } from './dto/tarjeta-credito-resumen.dto';
import { Gasto } from 'src/Gasto/gasto.entity';

@Injectable()
export class TarjetaCreditoService {
  constructor(
    @InjectRepository(TarjetaCredito)
    private readonly tarjetaRepo: Repository<TarjetaCredito>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Banco)
    private readonly bancoRepo: Repository<Banco>,
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,
    @InjectRepository(Gasto)
    private readonly gastoRepo: Repository<Gasto>
  ) {}

  async crear(dto: CreateTarjetaCreditoDto, usuario: Usuario): Promise<TarjetaCredito> {
    const banco = await this.bancoRepo.findOneBy({ id: dto.bancoId });

    if (!usuario || !banco) throw new NotFoundException('Usuario o banco no encontrado');

    // Validación de duplicados
    const ultimos4 = (dto.numeroTarjeta || '').slice(-4);
    const nombreLower = (dto.nombreTarjeta || '').trim().toLowerCase();
    const existe = await this.tarjetaRepo
      .createQueryBuilder('tarjeta')
      .where('tarjeta.usuarioId = :usuarioId', { usuarioId: usuario.id })
      .andWhere('tarjeta.bancoId = :bancoId', { bancoId: dto.bancoId })
      .andWhere('LOWER(TRIM(tarjeta.nombreTarjeta)) = :nombre', { nombre: nombreLower })
      .andWhere('RIGHT(tarjeta.numeroTarjeta, 4) = :ultimos4', { ultimos4 })
      .andWhere('tarjeta.deletedAt IS NULL')
      .getOne();

    if (existe) {
      throw new BadRequestException('Ya existe una tarjeta con el mismo banco, nombre y últimos 4 dígitos');
    }

    const tarjeta = this.tarjetaRepo.create({
      ...dto,
      cierreCiclo: new Date(dto.cierreCiclo),
      fechaVencimiento: new Date(dto.fechaVencimiento),
      usuario,
      banco,
    });
    console.log('tarjeta', tarjeta);

    return this.tarjetaRepo.save(tarjeta);
  }

  async listarPorUsuario(usuarioId: number): Promise<TarjetaCredito[]> {
    return this.tarjetaRepo.find({
      where: {
        usuario: { id: usuarioId },
        deletedAt: null,
      },
      relations: ['banco'],
      order: { nombreTarjeta: 'ASC' },
    });
  }

  async actualizar(id: number, dto: UpdateTarjetaCreditoDto, usuarioId: number): Promise<TarjetaCredito> {
    const tarjeta = await this.tarjetaRepo.findOne({
      where: { id, usuario: { id: usuarioId }, deletedAt: null },
      relations: ['usuario', 'banco'],
    });

    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');

    // Validación de duplicados (excluyendo la tarjeta actual)
    const ultimos4 = (dto.numeroTarjeta || '').slice(-4);
    const nombreLower = (dto.nombreTarjeta || '').trim().toLowerCase();
    const existe = await this.tarjetaRepo
      .createQueryBuilder('tarjeta')
      .where('tarjeta.usuarioId = :usuarioId', { usuarioId })
      .andWhere('tarjeta.bancoId = :bancoId', { bancoId: dto.bancoId })
      .andWhere('LOWER(TRIM(tarjeta.nombreTarjeta)) = :nombre', { nombre: nombreLower })
      .andWhere('RIGHT(tarjeta.numeroTarjeta, 4) = :ultimos4', { ultimos4 })
      .andWhere('tarjeta.id != :id', { id })
      .andWhere('tarjeta.deletedAt IS NULL')
      .getOne();

    if (existe) {
      throw new BadRequestException('Ya existe una tarjeta con el mismo banco, nombre y últimos 4 dígitos');
    }

    Object.assign(tarjeta, {
      ...dto,
      cierreCiclo: dto.cierreCiclo ? new Date(dto.cierreCiclo) : tarjeta.cierreCiclo,
      fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : tarjeta.fechaVencimiento,
    });

    return this.tarjetaRepo.save(tarjeta);
  }

  async eliminar(id: number, usuarioId: number): Promise<void> {
    const tarjeta = await this.tarjetaRepo.findOne({
      where: { id, usuario: { id: usuarioId }, deletedAt: null },
    });

    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');

    await this.tarjetaRepo.softRemove(tarjeta);
  }

  private async getGastoActualMensual(tarjetaId: number, fecha: Date): Promise<number> {
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();
    const result = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .where('gasto.tarjetaCredito = :tarjetaId', { tarjetaId })
      .andWhere('MONTH(cuota.fechaVencimiento) = :mes', { mes })
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio })
      .select('SUM(cuota.montoCuota)', 'total')
      .getRawOne();
    return +(result?.total || 0);
  }

  private async getTotalConsumosPendientes(tarjetaId: number, fechaDesde: Date): Promise<number> {
    const result = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .where('gasto.tarjetaCredito = :tarjetaId', { tarjetaId })
      .andWhere('cuota.pagada = false')
      .andWhere('cuota.fechaVencimiento >= :hoy', { hoy: fechaDesde })
      .select('SUM(cuota.montoCuota)', 'total')
      .getRawOne();
    return +(result?.total || 0);
  }

  async obtenerDetalleTarjeta(tarjetaId: number, usuarioId: number): Promise<TarjetaCreditoDetalleDto> {
    const tarjeta = await this.tarjetaRepo.findOne({
      where: { id: tarjetaId, usuario: { id: usuarioId }, deletedAt: null },
      relations: ['banco'],
    });
    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');

    const now = new Date();
    const gastoActualMensual = await this.getGastoActualMensual(tarjetaId, now);
    const totalConsumosPendientes = await this.getTotalConsumosPendientes(tarjetaId, now);
    const limiteDisponible = +(tarjeta.limiteCredito - totalConsumosPendientes);

    return {
      tarjetaId: tarjeta.id,
      nombreTarjeta: tarjeta.nombreTarjeta,
      banco: tarjeta.banco?.nombre ?? tarjeta.banco?.nombre ?? undefined,
      limiteTotal: tarjeta.limiteCredito,
      gastoActualMensual,
      totalConsumosPendientes,
      limiteDisponible,
    };
  }

  async obtenerResumenTarjetasPorUsuario(usuarioId: number): Promise<TarjetaCreditoResumenDto[]> {
    const tarjetas = await this.tarjetaRepo.find({
      where: { usuario: { id: usuarioId }, deletedAt: null },
      relations: ['banco'],
      order: { nombreTarjeta: 'ASC' },
    });

    const now = new Date();

    const resumenes: TarjetaCreditoResumenDto[] = [];
    for (const tarjeta of tarjetas) {
      const gastoActualMensual = await this.getGastoActualMensual(tarjeta.id, now);
      const totalConsumosPendientes = await this.getTotalConsumosPendientes(tarjeta.id, now);
      const limiteDisponible = tarjeta.limiteCredito - gastoActualMensual - totalConsumosPendientes;

      resumenes.push({
        tarjetaId: tarjeta.id,
        nombreTarjeta: tarjeta.nombreTarjeta,
        banco: tarjeta.banco?.nombre ?? '',
        ultimos4: (tarjeta.numeroTarjeta || '').slice(-4),
        gastoActualMensual,
        totalConsumosPendientes,
        limiteDisponible,
        limiteTotal: tarjeta.limiteCredito,
      });
    }

    return resumenes;
  }

  // NUEVO: Movimientos recientes de la tarjeta
  async obtenerMovimientosTarjeta(tarjetaId: number, usuarioId: number) {
    // Trae los gastos con cuotas pendientes (cuotasRestantes > 0)
    const now = new Date();
    const gastos = await this.gastoRepo.find({
      where: { tarjetaCredito: { id: tarjetaId }, usuario: { id: usuarioId } },
      relations: ['categoria', 'cuotas'],
      order: { fecha: 'DESC' },
    });

    // Solo los que tienen cuotas pendientes
    const movimientos = gastos
      .filter((g) => g.esEnCuotas && g.totalCuotas > 0)
      .map((g) => {
        // Calcular cuotas pendientes y monto de cada cuota
        const fechaGasto = new Date(g.fecha);
        const mesesTranscurridos =
          (now.getFullYear() - fechaGasto.getFullYear()) * 12 + (now.getMonth() - fechaGasto.getMonth());
        const cuotasPendientes = Math.max(g.totalCuotas - mesesTranscurridos, 0);

        // Buscar la cuota actual pendiente (la próxima no pagada)
        const cuotaPendiente = g.cuotas?.find((c) => !c.pagada && new Date(c.fechaVencimiento) >= now);
        const montoCuota = cuotaPendiente ? Number(cuotaPendiente.montoCuota) : g.monto / g.totalCuotas;

        return {
          fecha: g.fecha,
          descripcion: g.descripcion,
          cuotasPendientes,
          montoCuota,
          total: cuotasPendientes * montoCuota,
        };
      })
      .filter((mov) => mov.cuotasPendientes > 0);

    return movimientos;
  }
}
