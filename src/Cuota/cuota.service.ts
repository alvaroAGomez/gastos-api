// src/modules/Cuota/cuota.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Cuota } from './cuota.entity';
import { ApiResponse, ApiResponseBuilder } from '../common/response/api-response.builder';
import { EstadoCuenta } from 'src/EstadoCuenta/estado-cuenta.entity';
import { Gasto } from 'src/Gasto/gasto.entity';
import { EstadoCuentaService } from 'src/EstadoCuenta/estado-cuenta.service';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';

type Moneda = 'ARS' | 'USD';

interface CrearPlanParams {
  gastoId: number;
  tarjetaId: number;
  moneda: Moneda | string;
  montoTotal: number; // total del gasto (se prorratea)
  cantidad: number; // n cuotas (>= 1). Si tu regla es “cuotas” => >=2, validalo arriba.
  fechaCompra: Date; // 1ª cuota usa esta fecha
  numeroInicial?: number; // default 1
  modo?: 'crear' | 'editar';
  forzar?: boolean;
}

@Injectable()
export class CuotaService {
  constructor(
    @InjectRepository(Cuota) private readonly cuotaRepo: Repository<Cuota>,
    @InjectRepository(EstadoCuenta) private readonly estadoRepo: Repository<EstadoCuenta>,
    @InjectRepository(TarjetaCredito) private readonly tarjetaRepo: Repository<TarjetaCredito>,
    private readonly dataSource: DataSource,
    private readonly estadoCuentaService: EstadoCuentaService
  ) {}

  public async crearPlanParaGasto(manager: EntityManager, params: CrearPlanParams): Promise<ApiResponse<Cuota[]>> {
    const {
      gastoId,
      tarjetaId,
      moneda,
      montoTotal,
      cantidad,
      fechaCompra,
      numeroInicial = 1,
      modo = 'crear',
      forzar = false,
    } = params;

    if (!cantidad || cantidad < 1) {
      return ApiResponseBuilder.error(400, 'La cantidad de cuotas debe ser >= 1');
    }

    // Obtener la tarjeta para poder crear estados automáticamente
    const tarjeta = await manager.getRepository(TarjetaCredito).findOne({
      where: { id: tarjetaId },
    });
    if (!tarjeta) {
      return ApiResponseBuilder.error(404, 'Tarjeta no encontrada');
    }

    // Fechas: 1ª = compra; resto +1m, +2m, ...
    const fechas = this.generarFechasCuotas(fechaCompra, cantidad);

    // Asegurar estados para todas las fechas de una vez (más eficiente)
    await this.estadoCuentaService.ensureEstadosParaFechas(manager, tarjeta, fechas);

    // Obtener estados actualizados después de crearlos
    const estados = await manager.getRepository(EstadoCuenta).find({
      where: { tarjeta_id: tarjetaId },
      order: { fecha_cierre: 'ASC' },
    });

    // Prorrateo exacto en centavos (distribuye el resto en las primeras cuotas)
    const totalCent = Math.round(Number(montoTotal) * 100);
    const baseCent = Math.floor(totalCent / cantidad);
    const resto = totalCent % cantidad;

    const cuotas: Cuota[] = [];
    for (let i = 0; i < cantidad; i++) {
      const f = fechas[i];

      // EC por fecha de **cada cuota** - ahora debería existir
      let ec = this.estadoParaFecha(f, estados);
      if (!ec) {
        return ApiResponseBuilder.error(400, `No hay estado de cuenta para la cuota #${i + 1} (esto no debería pasar)`);
      }

      if (ec.estado === 'cerrado') {
        if (modo === 'editar' && !forzar) {
          return ApiResponseBuilder.error(400, `La cuota #${i + 1} cae en un estado cerrado`);
        }
        // en creación, mover al siguiente abierto
        const siguienteEstado = this.siguienteAbierto(ec, estados);
        if (!siguienteEstado) {
          // Crear un nuevo estado abierto para el mes siguiente
          const fechaSiguiente = new Date(f);
          fechaSiguiente.setMonth(fechaSiguiente.getMonth() + 1);
          ec = await this.estadoCuentaService.ensureEstadoParaMes(manager, tarjeta, fechaSiguiente);
        } else {
          ec = siguienteEstado;
        }
      }

      const montoCent = baseCent + (i < resto ? 1 : 0);
      const montoCuota = montoCent / 100;

      cuotas.push(
        this.cuotaRepo.create({
          gasto_id: gastoId,
          estado_id: ec.id,
          numero: numeroInicial + i,
          fecha_cuota: f,
          monto_cuota: montoCuota,
          moneda: moneda as Moneda,
        })
      );
    }

    try {
      const saved = await manager.save(Cuota, cuotas);
      return ApiResponseBuilder.success(saved, `Se crearon ${saved.length} cuota(s) para el gasto ${gastoId}`);
    } catch (error: any) {
      return ApiResponseBuilder.error(500, `Error al crear cuotas: ${error.message}`);
    }
  }

  /**
   * WRAPPER DE COMPATIBILIDAD con tu firma anterior.
   * Ahora ignora 'estados' y 'ecCompra' recibidos y delega en crearPlanParaGasto.
   */
  public async createCuotasForGasto(
    manager: EntityManager,
    params: {
      gastoId: number;
      moneda: string;
      montoTotal: number;
      cantidad: number;
      fechaCompra: Date;
      estados?: EstadoCuenta[]; // ignorado
      ecCompra?: EstadoCuenta; // ignorado
      numeroInicial?: number;
    }
  ): Promise<ApiResponse<Cuota[]>> {
    // necesitamos tarjeta_id para buscar estados; lo traemos del gasto
    const gasto = await manager.getRepository(Gasto).findOne({ where: { id: params.gastoId } });
    if (!gasto) return ApiResponseBuilder.error(404, 'Gasto no encontrado');

    return this.crearPlanParaGasto(manager, {
      gastoId: params.gastoId,
      tarjetaId: gasto.tarjeta_id,
      moneda: params.moneda as Moneda,
      montoTotal: params.montoTotal,
      cantidad: params.cantidad,
      fechaCompra: params.fechaCompra,
      numeroInicial: params.numeroInicial ?? 1,
      modo: 'crear',
    });
  }

  // ----------------- Helpers de asignación y fechas -----------------

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
    for (let i = idx + 1; i < estados.length; i++) {
      if (estados[i].estado !== 'cerrado') return estados[i];
    }
    return undefined;
  }

  private failNoAbierto(): never {
    throw new BadRequestException('No hay estado abierto posterior disponible');
  }

  /** 1ª = fecha_compra; luego mismo día mes +1, +2… (clamp al último día) */
  private generarFechasCuotas(fechaCompra: Date, n: number): Date[] {
    const base = new Date(Date.UTC(fechaCompra.getUTCFullYear(), fechaCompra.getUTCMonth(), fechaCompra.getUTCDate()));
    const dia = base.getUTCDate();

    const addMonthsKeepDay = (d: Date, months: number) => {
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + months;
      const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      return new Date(Date.UTC(y, m, Math.min(dia, last)));
    };

    const out: Date[] = [];
    for (let i = 0; i < n; i++) out.push(addMonthsKeepDay(base, i));
    return out;
  }
}
