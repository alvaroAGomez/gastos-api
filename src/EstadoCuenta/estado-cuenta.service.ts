// src/modules/EstadoCuenta/estado-cuenta.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EstadoCuenta } from './estado-cuenta.entity';
import { TarjetaCredito } from '../TarjetaCredito/tarjeta-credito.entity';

type PoliticaNoHabil = 'siguiente' | 'anterior';

@Injectable()
export class EstadoCuentaService {
  constructor(
    @InjectRepository(EstadoCuenta) private readonly estadoRepo: Repository<EstadoCuenta>,
    @InjectRepository(TarjetaCredito) private readonly tarjetaRepo: Repository<TarjetaCredito>,
    private readonly ds: DataSource
  ) {}

  /** Asegura (crea si falta) el EC del mes cuyo cierre cae en `fechaRef` */
  async ensureEstadoParaMes(
    m: EntityManager,
    tarjeta: TarjetaCredito,
    fechaRef: Date,
    feriados?: Set<string>,
    politica: PoliticaNoHabil = 'siguiente',
    vencimientoMesSiguiente = true
  ): Promise<EstadoCuenta> {
    const y = fechaRef.getUTCFullYear();
    const m0 = fechaRef.getUTCMonth();

    const { inicio_periodo, fin_periodo, fecha_cierre, fecha_vencimiento } = this.calcularECParaMes(
      y,
      m0,
      tarjeta.dia_cierre_default,
      tarjeta.dia_vencimiento_default,
      politica,
      vencimientoMesSiguiente,
      feriados
    );

    const repo = m.getRepository(EstadoCuenta);
    let ec = await repo.findOne({ where: { tarjeta_id: tarjeta.id, inicio_periodo, fin_periodo } });
    if (ec) return ec;

    const hoy = new Date();
    ec = repo.create({
      tarjeta_id: tarjeta.id,
      inicio_periodo,
      fin_periodo,
      fecha_cierre,
      fecha_vencimiento,
      estado: fin_periodo.getTime() < hoy.getTime() ? 'cerrado' : 'abierto',
    });
    return repo.save(ec);
  }

  /** Asegura (crea si faltan) los EC de todas las fechas (1 por mes distinto) */
  async ensureEstadosParaFechas(
    m: EntityManager,
    tarjeta: TarjetaCredito,
    fechas: Date[],
    feriados?: Set<string>,
    politica: PoliticaNoHabil = 'siguiente',
    vencimientoMesSiguiente = true
  ): Promise<void> {
    const vistos = new Set(fechas.map((f) => `${f.getUTCFullYear()}-${f.getUTCMonth()}`));
    for (const ym of vistos) {
      const [ys, ms] = ym.split('-');
      const d = new Date(Date.UTC(+ys, +ms, 1));
      await this.ensureEstadoParaMes(m, tarjeta, d, feriados, politica, vencimientoMesSiguiente);
    }
  }

  // ---------- helpers de cálculo (misma lógica que veníamos usando) ----------
  private lastDomUTC(y: number, m0: number) {
    return new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
  }
  private clampUTC(y: number, m0: number, day: number) {
    const d = Math.min(day, this.lastDomUTC(y, m0));
    return new Date(Date.UTC(y, m0, d, 23, 59, 59, 999));
  }
  private isWeekendUTC(d: Date) {
    const wd = d.getUTCDay();
    return wd === 0 || wd === 6;
  }
  private isHolidayUTC(d: Date, feriados?: Set<string>) {
    return feriados ? feriados.has(d.toISOString().slice(0, 10)) : false;
  }
  private moverNoHabilUTC(d: Date, politica: PoliticaNoHabil, feriados?: Set<string>) {
    let cur = new Date(d);
    if (politica === 'siguiente') {
      while (this.isWeekendUTC(cur) || this.isHolidayUTC(cur, feriados)) {
        cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1, 23, 59, 59, 999));
      }
      return cur;
    } else {
      while (this.isWeekendUTC(cur) || this.isHolidayUTC(cur, feriados)) {
        cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() - 1, 23, 59, 59, 999));
      }
      return cur;
    }
  }
  private calcularECParaMes(
    year: number,
    monthIndex0: number,
    diaCierre: number,
    diaVenc: number,
    politica: PoliticaNoHabil,
    vencimientoMesSiguiente: boolean,
    feriados?: Set<string>
  ) {
    const cierreEstimado = this.clampUTC(year, monthIndex0, diaCierre);
    const fecha_cierre = this.moverNoHabilUTC(cierreEstimado, politica, feriados);

    const prev = new Date(Date.UTC(year, monthIndex0, 1));
    prev.setUTCMonth(prev.getUTCMonth() - 1);
    const cierrePrevEstimado = this.clampUTC(prev.getUTCFullYear(), prev.getUTCMonth(), diaCierre);
    const inicio_periodo = this.moverNoHabilUTC(cierrePrevEstimado, politica, feriados);

    const vencY = vencimientoMesSiguiente ? (monthIndex0 === 11 ? year + 1 : year) : year;
    const vencM0 = vencimientoMesSiguiente ? (monthIndex0 + 1) % 12 : monthIndex0;
    const vencEstimado = this.clampUTC(vencY, vencM0, diaVenc);
    const fecha_vencimiento = this.moverNoHabilUTC(vencEstimado, politica, feriados);

    const fin_periodo = fecha_cierre;
    return { inicio_periodo, fin_periodo, fecha_cierre, fecha_vencimiento };
  }

  async crearEstadoInicialParaTarjeta(tarjetaId: number, feriados?: Set<string>): Promise<EstadoCuenta> {
    return this.ds.transaction(async (m) => {
      const tarjeta = await m.getRepository(TarjetaCredito).findOne({ where: { id: tarjetaId } });
      if (!tarjeta) {
        throw new Error('Tarjeta no encontrada');
      }

      const hoy = new Date();
      const y = hoy.getUTCFullYear();
      const m0 = hoy.getUTCMonth();

      // calculamos el EC del mes actual
      const { inicio_periodo, fin_periodo, fecha_cierre, fecha_vencimiento } = this.calcularECParaMes(
        y,
        m0,
        tarjeta.dia_cierre_default,
        tarjeta.dia_vencimiento_default,
        'siguiente',
        true,
        feriados
      );

      // verificamos si ya existe
      let ec = await m.getRepository(EstadoCuenta).findOne({
        where: { tarjeta_id: tarjeta.id, inicio_periodo, fin_periodo },
      });
      if (ec) return ec;

      // creamos nuevo estado
      ec = m.getRepository(EstadoCuenta).create({
        tarjeta_id: tarjeta.id,
        inicio_periodo,
        fin_periodo,
        fecha_cierre,
        fecha_vencimiento,
        estado: 'abierto',
      });

      return m.save(ec);
    });
  }
}
