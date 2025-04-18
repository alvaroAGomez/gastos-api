import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarjetaCredito } from './tarjeta-credito.entity';
import { CreateTarjetaCreditoDto } from './dto/create-tarjeta-credito.dto';
import { Usuario } from 'src/Usuario/usuario.entity';
import { Banco } from 'src/Banco/banco.entity';
import { UpdateTarjetaCreditoDto } from './dto/update-tarjeta-credito.dto';
import { TarjetaCreditoDetalleDto } from './dto/tarjeta-credito-detalle.dto';
import { Cuota } from 'src/Cuota/cuota.entity';

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
    private readonly cuotaRepo: Repository<Cuota>
  ) {}

  async crear(dto: CreateTarjetaCreditoDto, usuario: Usuario): Promise<TarjetaCredito> {
    const banco = await this.bancoRepo.findOneBy({ id: dto.bancoId });

    if (!usuario || !banco) throw new NotFoundException('Usuario o banco no encontrado');

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

  async obtenerDetalleTarjeta(tarjetaId: number, usuarioId: number): Promise<TarjetaCreditoDetalleDto> {
    const tarjeta = await this.tarjetaRepo.findOne({
      where: { id: tarjetaId, usuario: { id: usuarioId }, deletedAt: null },
      relations: ['banco'],
    });
    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');

    // Gasto actual mensual: suma de cuotas de este mes y año
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const gastoActual = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .where('gasto.tarjetaCredito = :tarjetaId', { tarjetaId })
      .andWhere('MONTH(cuota.fechaVencimiento) = :mes', { mes })
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio })
      .select('SUM(cuota.montoCuota)', 'total')
      .getRawOne();

    // Total consumos pendientes: suma de todas las cuotas no pagadas desde hoy en adelante
    const totalPendiente = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .where('gasto.tarjetaCredito = :tarjetaId', { tarjetaId })
      .andWhere('cuota.pagada = false')
      .andWhere('cuota.fechaVencimiento >= :hoy', { hoy: new Date() })
      .select('SUM(cuota.montoCuota)', 'total')
      .getRawOne();

    const gastoActualMensual = +(gastoActual?.total || 0);
    const totalConsumosPendientes = +(totalPendiente?.total || 0);
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
}
