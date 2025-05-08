import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarjetaCredito } from './tarjeta-credito.entity';
import { CreateTarjetaCreditoDto } from './dto/create-tarjeta-credito.dto';
import { Usuario } from 'src/Usuario/usuario.entity';
import { Banco } from 'src/Banco/banco.entity';
import { UpdateTarjetaCreditoDto } from './dto/update-tarjeta-credito.dto';
import { TarjetaCreditoDetalleDto } from './dto/tarjeta-credito-detalle.dto';
import { TarjetaCreditoResumenDto } from './dto/tarjeta-credito-resumen.dto';
import { Cuota } from 'src/Cuota/cuota.entity';
import { Gasto } from 'src/Gasto/gasto.entity';

@Injectable()
export class TarjetaCreditoService {
  constructor(
    @InjectRepository(TarjetaCredito)
    private readonly tarjetaRepo: Repository<TarjetaCredito>,
    @InjectRepository(Banco)
    private readonly bancoRepo: Repository<Banco>,
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,
    @InjectRepository(Gasto)
    private readonly gastoRepo: Repository<Gasto>
  ) {}

  async crearTarjetaCredito(dto: CreateTarjetaCreditoDto, usuario: Usuario): Promise<TarjetaCredito> {
    const banco = await this.bancoRepo.findOneBy({ id: dto.bancoId });
    if (!usuario || !banco) {
      throw new NotFoundException('Usuario o banco no encontrado');
    }

    await this.validarTarjetaDuplicada(dto, usuario.id);

    const tarjeta = this.tarjetaRepo.create({
      ...dto,
      cierreCiclo: new Date(dto.cierreCiclo),
      fechaVencimiento: new Date(dto.fechaVencimiento),
      usuario,
      banco,
    });

    return this.tarjetaRepo.save(tarjeta);
  }

  async actualizarTarjetaCredito(id: number, dto: UpdateTarjetaCreditoDto, usuarioId: number): Promise<TarjetaCredito> {
    const tarjeta = await this.obtenerTarjetaPorId(id, usuarioId);

    await this.validarTarjetaDuplicada(dto, usuarioId, id);

    Object.assign(tarjeta, {
      ...dto,
      cierreCiclo: dto.cierreCiclo ? new Date(dto.cierreCiclo) : tarjeta.cierreCiclo,
      fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : tarjeta.fechaVencimiento,
    });

    return this.tarjetaRepo.save(tarjeta);
  }

  async eliminarTarjetaCredito(id: number, usuarioId: number): Promise<void> {
    const tarjeta = await this.obtenerTarjetaPorId(id, usuarioId);
    await this.tarjetaRepo.softRemove(tarjeta);
  }

  async obtenerTarjetasDelUsuario(usuarioId: number): Promise<TarjetaCredito[]> {
    return this.tarjetaRepo.find({
      where: {
        usuario: { id: usuarioId },
        deletedAt: null,
      },
      relations: ['banco'],
      order: { nombreTarjeta: 'ASC' },
    });
  }

  async obtenerDetalleTarjeta(tarjetaId: number, usuarioId: number): Promise<TarjetaCreditoDetalleDto> {
    const tarjeta = await this.obtenerTarjetaPorId(tarjetaId, usuarioId);

    const now = new Date();
    const gastoActualMensual = await this.getGastoActualMensual(tarjetaId, now);
    const totalConsumosPendientes = await this.getTotalConsumosPendientes(tarjetaId, now);
    const limiteDisponible = +(tarjeta.limiteCredito - totalConsumosPendientes - gastoActualMensual);

    return {
      tarjetaId: tarjeta.id,
      nombreTarjeta: tarjeta.nombreTarjeta,
      banco: tarjeta.banco?.nombre,
      limiteTotal: tarjeta.limiteCredito,
      gastoActualMensual,
      totalConsumosPendientes,
      limiteDisponible,
    };
  }

  async obtenerResumenTarjetasPorUsuario(usuarioId: number): Promise<TarjetaCreditoResumenDto[]> {
    const tarjetas = await this.obtenerTarjetasDelUsuario(usuarioId);
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

  async obtenerMovimientosTarjeta(tarjetaId: number, usuarioId: number) {
    const now = new Date();

    const gastos = await this.gastoRepo.find({
      where: { tarjetaCredito: { id: tarjetaId }, usuario: { id: usuarioId } },
      relations: ['categoria', 'cuotas'],
      order: { fecha: 'DESC' },
    });

    return gastos
      .filter((g) => g.esEnCuotas && g.totalCuotas > 0)
      .map((g) => this.calcularMovimiento(g, now))
      .filter((mov) => mov.cuotasPendientes > 0);
  }

  // ----------------------- MÉTODOS PRIVADOS -----------------------

  private async validarTarjetaDuplicada(
    dto: CreateTarjetaCreditoDto | UpdateTarjetaCreditoDto,
    usuarioId: number,
    excluirId?: number
  ): Promise<void> {
    const ultimos4 = (dto.numeroTarjeta || '').slice(-4);
    const nombreLower = (dto.nombreTarjeta || '').trim().toLowerCase();

    const qb = this.tarjetaRepo
      .createQueryBuilder('tarjeta')
      .where('tarjeta.usuarioId = :usuarioId', { usuarioId })
      .andWhere('tarjeta.bancoId = :bancoId', { bancoId: dto.bancoId })
      .andWhere('LOWER(TRIM(tarjeta.nombreTarjeta)) = :nombre', { nombre: nombreLower })
      .andWhere('RIGHT(tarjeta.numeroTarjeta, 4) = :ultimos4', { ultimos4 })
      .andWhere('tarjeta.deletedAt IS NULL');

    if (excluirId) {
      qb.andWhere('tarjeta.id != :id', { id: excluirId });
    }

    const existe = await qb.getOne();
    if (existe) {
      throw new BadRequestException('Ya existe una tarjeta con el mismo banco, nombre y últimos 4 dígitos');
    }
  }

  private async obtenerTarjetaPorId(id: number, usuarioId: number): Promise<TarjetaCredito> {
    const tarjeta = await this.tarjetaRepo.findOne({
      where: { id, usuario: { id: usuarioId }, deletedAt: null },
      relations: ['banco'],
    });

    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');

    return tarjeta;
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
    const fechaLimite = new Date(fechaDesde.getFullYear(), fechaDesde.getMonth() + 1, 1); // primer día del mes siguiente
    const result = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .where('gasto.tarjetaCredito = :tarjetaId', { tarjetaId })
      .andWhere('cuota.pagada = false')
      .andWhere('cuota.fechaVencimiento >= :limite', { limite: fechaLimite })
      .select('SUM(cuota.montoCuota)', 'total')
      .getRawOne();

    return +(result?.total || 0);
  }

  private calcularMovimiento(gasto: Gasto, fechaActual: Date) {
    const fechaGasto = new Date(gasto.fecha);
    const mesesTranscurridos =
      (fechaActual.getFullYear() - fechaGasto.getFullYear()) * 12 + (fechaActual.getMonth() - fechaGasto.getMonth());

    const cuotasPendientes = Math.max(gasto.totalCuotas - mesesTranscurridos, 0);
    const cuotaPendiente = gasto.cuotas?.find((c) => !c.pagada && new Date(c.fechaVencimiento) >= fechaActual);

    const montoCuota = cuotaPendiente ? Number(cuotaPendiente.montoCuota) : gasto.monto / gasto.totalCuotas;

    return {
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
      cuotasPendientes,
      montoCuota,
      total: cuotasPendientes * montoCuota,
    };
  }
}
