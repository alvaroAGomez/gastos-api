// src/modules/Cuota/cuota.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Cuota } from './cuota.entity';
import { ApiResponse, ApiResponseBuilder } from '../common/response/api-response.builder';
import { EstadoCuenta } from 'src/EstadoCuenta/estado-cuenta.entity';

interface CreateCuotasForGastoParams {
  gastoId: number;
  moneda: string; // 'ARS' | 'USD'
  montoTotal: number; // monto total del gasto (se prorratea)
  cantidad: number; // n cuotas (>=1)
  fechaCompra: Date; // fecha de compra original
  estados: EstadoCuenta[]; // estados de la tarjeta (ordenados asc por fecha_cierre)
  ecCompra: EstadoCuenta; // estado asignado a la compra
  numeroInicial?: number; // default 1
}

@Injectable()
export class CuotaService {
  constructor(
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Genera y guarda TODAS las cuotas de un gasto **dentro de la misma transacción** del caller.
   * No abre una transacción propia; usa el `manager` recibido.
   */
  async createCuotasForGasto(
    manager: EntityManager,
    params: CreateCuotasForGastoParams
  ): Promise<ApiResponse<Cuota[]>> {
    if (!params.cantidad || params.cantidad < 1) {
      return ApiResponseBuilder.error(400, 'La cantidad de cuotas debe ser >= 1');
    }

    // Fechas según regla (si compra <= cierre => entra ese mes; si no => mes siguiente)
    const fechas = this.generarFechasCuotas(params.fechaCompra, params.estados, params.cantidad, params.ecCompra);

    // Prorrateo exacto (centavos)
    const totalCent = Math.round(params.montoTotal * 100);
    const baseCent = Math.floor(totalCent / params.cantidad);
    const resto = totalCent % params.cantidad;

    const numeroInicial = params.numeroInicial ?? 1;
    const cuotas: Cuota[] = [];

    for (let i = 0; i < params.cantidad; i++) {
      const f = fechas[i];

      let ec = this.estadoParaFecha(f, params.estados);
      if (!ec) {
        return ApiResponseBuilder.error(400, `No hay estado para la cuota #${i + 1}`);
      }
      if (ec.estado === 'cerrado') {
        ec = this.siguienteAbierto(ec, params.estados) ?? this.failNoAbierto();
      }

      const montoCent = baseCent + (i < resto ? 1 : 0);
      const montoCuota = montoCent / 100;

      const cuota = this.cuotaRepo.create({
        gasto_id: params.gastoId,
        estado_id: ec.id,
        numero: numeroInicial + i,
        fecha_cuota: f,
        monto_cuota: montoCuota,
        moneda: params.moneda,
      });

      cuotas.push(cuota);
    }

    try {
      const saved = await manager.save(Cuota, cuotas);
      return ApiResponseBuilder.success(saved, `Se crearon ${saved.length} cuota(s) para el gasto ${params.gastoId}`);
    } catch (error: any) {
      return ApiResponseBuilder.error(500, `Error al crear cuotas: ${error.message}`);
    }
  }

  // ----------------- Helpers locales (mismos criterios que usabas) -----------------

  /** Criterio de asignación por rango (inicio, fin] */
  private estadoParaFecha(fecha: Date, estados: EstadoCuenta[]) {
    for (const e of estados) {
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

  /**
   * Si compra <= cierre => primera cuota en el mismo mes (clamp al último día válido);
   * si compra > cierre => primera cuota al mes siguiente; resto: +1 mes secuencial.
   */
  private generarFechasCuotas(fechaCompra: Date, estados: EstadoCuenta[], n: number, ecCompra: EstadoCuenta) {
    const primera =
      fechaCompra <= new Date(ecCompra.fecha_cierre)
        ? this.clampDia(new Date(fechaCompra))
        : this.addMonths(this.clampDia(new Date(fechaCompra)), 1);

    const out = [primera];
    for (let i = 1; i < n; i++) out.push(this.addMonths(primera, i));
    return out;
  }
}
