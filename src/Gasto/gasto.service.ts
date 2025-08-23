// src/modules/gastos/gastos.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cuota } from 'src/Cuota/cuota.entity';
import { DebitoConfig } from 'src/DebitoConfig/debito-config.entity';
import { EstadoCuenta } from 'src/EstadoCuenta/estado-cuenta.entity';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { Repository, DataSource } from 'typeorm';
import { Gasto } from './gasto.entity';

export type Moneda = 'ARS' | 'USD';
export type TipoGasto = 'normal' | 'cuotas' | 'debito';

export class CrearGastoDto {
  usuarioId!: number;
  tarjetaId!: number;
  categoriaId?: number;
  descripcion?: string;
  monto!: number;
  moneda!: Moneda;
  fechaCompra!: string; // 'YYYY-MM-DD'
  tipo!: TipoGasto;
  cuotas?: number; // si tipo='cuotas'
}

@Injectable()
export class GastosService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Gasto) private readonly gastoRepo: Repository<Gasto>,
    @InjectRepository(Cuota) private readonly cuotaRepo: Repository<Cuota>,
    @InjectRepository(DebitoConfig) private readonly debitoRepo: Repository<DebitoConfig>,
    @InjectRepository(EstadoCuenta) private readonly estadoRepo: Repository<EstadoCuenta>,
    @InjectRepository(TarjetaCredito) private readonly tarjetaRepo: Repository<TarjetaCredito>
  ) {}

  // ---------- Entrada única ----------
  async createGasto(dto: CrearGastoDto) {
    if (dto.tipo === 'debito') return this.createGastoDebito(dto);
    if (dto.tipo === 'cuotas') {
      if (!dto.cuotas || dto.cuotas < 2) throw new BadRequestException('Para cuotas, "cuotas" >= 2');
      return this.createGastoCuotas(dto);
    }
    return this.createGastoNormal(dto);
  }

  // ---------- Casos ----------
  private async createGastoNormal(dto: CrearGastoDto) {
    return this.ds.transaction(async (m) => {
      const tarjeta = await this.findTarjetaDelUsuario(m, dto.tarjetaId, dto.usuarioId);
      const estados = await this.findEstadosOrdenados(m, tarjeta.id);

      const fecha = new Date(dto.fechaCompra);
      let ec = this.estadoParaFecha(fecha, estados);
      if (!ec) throw new BadRequestException('No hay estado de cuenta para esa fecha');
      if (ec.estado === 'cerrado') ec = this.siguienteAbierto(ec, estados) ?? this.failNoAbierto();

      const gasto = m.getRepository(Gasto).create({
        usuario_id: dto.usuarioId,
        tarjeta_id: dto.tarjetaId,
        categoria_id: dto.categoriaId ?? null,
        estado_id: ec.id,
        descripcion: dto.descripcion ?? null,
        monto: dto.monto,
        moneda: dto.moneda,
        fecha_compra: new Date(dto.fechaCompra),
        es_debito_auto: false,
        debito_config_id: null,
      });
      const { id: gasto_id } = await m.getRepository(Gasto).save(gasto);

      // (opcional) cuota #1 por homogeneidad visual
      const cuota = m.getRepository(Cuota).create({
        gasto_id,
        estado_id: ec.id,
        numero: 1,
        fecha_cuota: new Date(dto.fechaCompra),
        monto_cuota: dto.monto,
        moneda: dto.moneda,
      });
      await m.getRepository(Cuota).save(cuota);

      return { gastoId: gasto_id, estadoId: ec.id };
    });
  }

  private async createGastoCuotas(dto: CrearGastoDto) {
    return this.ds.transaction(async (m) => {
      const tarjeta = await this.findTarjetaDelUsuario(m, dto.tarjetaId, dto.usuarioId);
      const estados = await this.findEstadosOrdenados(m, tarjeta.id);

      const fechaCompra = new Date(dto.fechaCompra);
      let ecCompra = this.estadoParaFecha(fechaCompra, estados);
      if (!ecCompra) throw new BadRequestException('No hay estado para esa fecha');
      if (ecCompra.estado === 'cerrado') ecCompra = this.siguienteAbierto(ecCompra, estados) ?? this.failNoAbierto();

      const gasto = m.getRepository(Gasto).create({
        usuario_id: dto.usuarioId,
        tarjeta_id: dto.tarjetaId,
        categoria_id: dto.categoriaId ?? null,
        estado_id: ecCompra.id,
        descripcion: dto.descripcion ?? null,
        monto: dto.monto,
        moneda: dto.moneda,
        fecha_compra: new Date(dto.fechaCompra),
        es_debito_auto: false,
        debito_config_id: null,
      });
      const { id: gasto_id } = await m.getRepository(Gasto).save(gasto);

      const n = dto.cuotas!;
      const montoCuota = this.redondeo(dto.monto / n);
      const fechas = this.generarFechasCuotas(fechaCompra, estados, n, ecCompra);

      for (let i = 0; i < n; i++) {
        const f = fechas[i];
        let ec = this.estadoParaFecha(f, estados);
        if (!ec) throw new BadRequestException(`No hay estado para cuota #${i + 1}`);
        if (ec.estado === 'cerrado') ec = this.siguienteAbierto(ec, estados) ?? this.failNoAbierto();

        const c = m.getRepository(Cuota).create({
          gasto_id,
          estado_id: ec.id,
          numero: i + 1,
          fecha_cuota: f,
          monto_cuota: montoCuota,
          moneda: dto.moneda,
        });
        await m.getRepository(Cuota).save(c);
      }

      return { gastoId: gasto_id, cuotas: n };
    });
  }

  private async createGastoDebito(dto: CrearGastoDto) {
    return this.ds.transaction(async (m) => {
      const tarjeta = await this.findTarjetaDelUsuario(m, dto.tarjetaId, dto.usuarioId);
      const estados = await this.findEstadosOrdenados(m, tarjeta.id);

      const fecha = new Date(dto.fechaCompra);
      let ec = this.estadoParaFecha(fecha, estados);
      if (!ec) throw new BadRequestException('No hay estado de cuenta para esa fecha');
      if (ec.estado === 'cerrado') ec = this.siguienteAbierto(ec, estados) ?? this.failNoAbierto();

      const gasto = m.getRepository(Gasto).create({
        usuario_id: dto.usuarioId,
        tarjeta_id: dto.tarjetaId,
        categoria_id: dto.categoriaId ?? null,
        estado_id: ec.id,
        descripcion: dto.descripcion ?? 'Débito automático',
        monto: dto.monto,
        moneda: dto.moneda,
        fecha_compra: new Date(dto.fechaCompra),
        es_debito_auto: true,
        debito_config_id: null,
      });
      const { id } = await m.getRepository(Gasto).save(gasto);
      return { gastoId: id, estadoId: ec.id };
    });
  }

  /** Usado por el scheduler: crea el gasto del mes desde la configuración */
  async createGastoFromDebitoConfig(debitoConfigId: number, fechaOpcional?: string) {
    return this.ds.transaction(async (m) => {
      const dc = await m.getRepository(DebitoConfig).findOne({ where: { id: debitoConfigId, activo: true } });
      if (!dc) throw new NotFoundException('Configuración de débito no encontrada o inactiva');

      // Fecha = día de la suscripción en el mes actual (o en la fecha que pases)
      const base = fechaOpcional ? new Date(fechaOpcional) : new Date();
      const y = base.getUTCFullYear();
      const mo = base.getUTCMonth();
      const diaBase = new Date(dc.fecha_suscripcion).getUTCDate();
      const last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
      const dia = Math.min(diaBase, last);
      const fechaCompra = new Date(Date.UTC(y, mo, dia));

      const estados = await this.findEstadosOrdenados(m, dc.tarjeta_id);
      let ec = this.estadoParaFecha(fechaCompra, estados);
      if (!ec) throw new BadRequestException('No hay estado para esa fecha');
      if (ec.estado === 'cerrado') ec = this.siguienteAbierto(ec, estados) ?? this.failNoAbierto();

      const gasto = m.getRepository(Gasto).create({
        usuario_id: dc.usuario_id,
        tarjeta_id: dc.tarjeta_id,
        categoria_id: dc.categoria_id ?? null,
        estado_id: ec.id,
        descripcion: dc.descripcion,
        monto: Number(dc.monto),
        moneda: dc.moneda as any,
        fecha_compra: fechaCompra,
        es_debito_auto: true,
        debito_config_id: dc.id, // 👈 idempotencia por índice único (con periodo_mes)
      });

      try {
        const { id } = await m.getRepository(Gasto).save(gasto);
        return { gastoId: id, estadoId: ec.id };
      } catch (e: any) {
        if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062) {
          return { gastoId: 0, estadoId: ec.id, note: 'ya-existia' };
        }
        throw e;
      }
    });
  }

  // ---------- helpers ----------
  private async findTarjetaDelUsuario(m: any, tarjetaId: number, usuarioId: number) {
    const tarjeta = await m.getRepository(TarjetaCredito).findOne({
      where: { id: tarjetaId },
      relations: ['usuario'],
    });
    if (!tarjeta || (tarjeta.usuario as any)?.id !== usuarioId) {
      throw new NotFoundException('Tarjeta no encontrada o no pertenece al usuario');
    }
    return tarjeta;
  }

  private async findEstadosOrdenados(m: any, tarjetaId: number) {
    return m.getRepository(EstadoCuenta).find({
      where: { tarjeta_id: tarjetaId },
      order: { fecha_cierre: 'ASC' },
    });
  }

  /** Criterio de asignación por rango (inicio, fin] */
  private estadoParaFecha(fecha: Date, estados: EstadoCuenta) {
    for (const e of estados as any as EstadoCuenta[]) {
      const ini = new Date(e.inicio_periodo); // excluyente
      const fin = new Date(e.fin_periodo); // incluyente
      if (fecha > ini && fecha <= fin) return e;
    }
    return undefined;
  }
  private siguienteAbierto(actual: EstadoCuenta, estados: EstadoCuenta[]) {
    const idx = estados.findIndex((e) => e.id === actual.id);
    for (let i = idx + 1; i < estados.length; i++) if (estados[i].estado !== 'cerrado') return estados[i];
    return undefined;
  }
  private failNoAbierto(): never {
    throw new BadRequestException('No hay estado abierto posterior disponible');
  }

  private clampDia(d: Date) {
    const y = d.getUTCFullYear(),
      m = d.getUTCMonth(),
      day = d.getUTCDate();
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(day, last)));
  }
  private addMonths(base: Date, months: number) {
    const y = base.getUTCFullYear(),
      m = base.getUTCMonth() + months,
      day = base.getUTCDate();
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(day, last)));
  }
  private generarFechasCuotas(fechaCompra: Date, estados: EstadoCuenta[], n: number, ecCompra: EstadoCuenta) {
    const primera =
      fechaCompra <= new Date(ecCompra.fecha_cierre)
        ? this.clampDia(new Date(fechaCompra))
        : this.addMonths(this.clampDia(new Date(fechaCompra)), 1);
    const out = [primera];
    for (let i = 1; i < n; i++) out.push(this.addMonths(primera, i));
    return out;
  }
  private redondeo(n: number) {
    return Math.round(n * 100) / 100;
  }
}
