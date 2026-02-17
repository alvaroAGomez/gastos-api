// src/modules/Cuota/cuota.service.ts
import { Injectable } from '@nestjs/common';
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
  montoTotal: number;
  cantidad: number;
  fechaCompra: Date;
  numeroInicial?: number;
  modo?: 'crear' | 'editar';
  forzar?: boolean;
}

interface MontoProrratado {
  baseCent: number;
  resto: number;
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
    // Validación
    const validationError = this.validarParametros(params);
    if (validationError) return validationError;

    // Obtener tarjeta
    const tarjeta = await this.obtenerTarjeta(manager, params.tarjetaId);
    if (!tarjeta.ok) return tarjeta.response;

    // Generar fechas y asegurar estados
    const fechas = this.generarFechasCuotas(params.fechaCompra, params.cantidad);
    await this.estadoCuentaService.ensureEstadosParaFechas(manager, tarjeta.data, fechas);

    // Cargar estados
    const estados = await this.cargarEstados(manager, params.tarjetaId);

    // Calcular prorrateo
    const montos = this.calcularMontoProrratado(params.montoTotal, params.cantidad);

    // Crear cuotas
    const cuotas: Cuota[] = [];
    for (let i = 0; i < params.cantidad; i++) {
      const ec = await this.resolverEstadoParaCuota(
        manager,
        fechas[i],
        estados,
        tarjeta.data,
        params.tarjetaId,
        params.modo || 'crear',
        params.forzar || false,
        i
      );

      if (!ec.ok) return ec.response;

      const montoCuota = this.calcularMontoCuota(i, montos);
      cuotas.push(
        this.crearCuota(
          params.gastoId,
          ec.data,
          params.numeroInicial || 1,
          i,
          fechas[i],
          montoCuota,
          params.moneda as Moneda
        )
      );
    }

    // Guardar cuotas
    return this.guardarCuotas(manager, cuotas, params.gastoId);
  }

  public async createCuotasForGasto(
    manager: EntityManager,
    params: {
      gastoId: number;
      moneda: string;
      montoTotal: number;
      cantidad: number;
      fechaCompra: Date;
      estados?: EstadoCuenta[];
      ecCompra?: EstadoCuenta;
      numeroInicial?: number;
    }
  ): Promise<ApiResponse<Cuota[]>> {
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

  // ===================== VALIDACIÓN =====================

  private validarParametros(params: CrearPlanParams): ApiResponse<any> | null {
    if (!params.cantidad || params.cantidad < 1) {
      return ApiResponseBuilder.error(400, 'La cantidad de cuotas debe ser >= 1');
    }
    return null;
  }

  // ===================== INICIALIZACIÓN =====================

  private async obtenerTarjeta(
    manager: EntityManager,
    tarjetaId: number
  ): Promise<{ ok: boolean; data?: TarjetaCredito; response?: ApiResponse<any> }> {
    const tarjeta = await manager.getRepository(TarjetaCredito).findOne({ where: { id: tarjetaId } });
    if (!tarjeta) {
      return { ok: false, response: ApiResponseBuilder.error(404, 'Tarjeta no encontrada') };
    }
    return { ok: true, data: tarjeta };
  }

  private async cargarEstados(manager: EntityManager, tarjetaId: number): Promise<EstadoCuenta[]> {
    return manager.getRepository(EstadoCuenta).find({
      where: { tarjeta_id: tarjetaId },
      order: { inicio_periodo: 'ASC' },
    });
  }

  // ===================== CÁLCULOS =====================

  private calcularMontoProrratado(montoTotal: number, cantidad: number): MontoProrratado {
    const totalCent = Math.round(Number(montoTotal) * 100);
    const baseCent = Math.floor(totalCent / cantidad);
    const resto = totalCent % cantidad;
    return { baseCent, resto };
  }

  private calcularMontoCuota(indice: number, montos: MontoProrratado): number {
    const montoCent = montos.baseCent + (indice < montos.resto ? 1 : 0);
    return montoCent / 100;
  }

  // ===================== RESOLUCIÓN DE ESTADOS =====================

  private async resolverEstadoParaCuota(
    manager: EntityManager,
    fecha: Date,
    estados: EstadoCuenta[],
    tarjeta: TarjetaCredito,
    tarjetaId: number,
    modo: string,
    forzar: boolean,
    indice: number
  ): Promise<{ ok: boolean; data?: EstadoCuenta; response?: ApiResponse<any> }> {
    // Intentar encontrar estado para la fecha
    let ec = this.buscarEstadoEnMemoria(fecha, estados);

    if (!ec) {
      // Si no encuentra, buscar por contexto (antigua o futura)
      const esOld = new Date(fecha) < new Date();
      ec = await this.buscarEstadoContextual(manager, fecha, estados, tarjetaId, esOld);
    }

    if (!ec) {
      // Si aún no hay estado, crear uno nuevo
      ec = await this.estadoCuentaService.ensureEstadoParaMes(manager, tarjeta, fecha);
      this.actualizarEstadoEnLista(estados, ec);
    }

    // Si el estado está cerrado, resolver
    if (ec.estado === 'cerrado') {
      if (modo === 'editar' && !forzar) {
        return {
          ok: false,
          response: ApiResponseBuilder.error(400, `La cuota #${indice + 1} cae en un estado cerrado`),
        };
      }

      const ecResuelto = await this.resolverEstadoCerrado(manager, ec, fecha, estados, tarjeta);
      if (!ecResuelto.ok) return ecResuelto;
      ec = ecResuelto.data;
    }

    return { ok: true, data: ec };
  }

  private async buscarEstadoContextual(
    manager: EntityManager,
    fecha: Date,
    estados: EstadoCuenta[],
    tarjetaId: number,
    esOld: boolean
  ): Promise<EstadoCuenta | undefined> {
    if (esOld) {
      // Para fechas antiguas, buscar estado cerrado
      let ec = this.buscarEstadoEnMemoria(fecha, estados, true);

      if (!ec) {
        // Consultar BD directamente
        ec = await this.buscarEstadoEnBD(manager, tarjetaId, fecha);
      }

      if (!ec) {
        // Buscar siguiente abierto
        ec = this.obtenerSiguienteEstadoAbierto(fecha, estados);
      }

      return ec;
    } else {
      // Para fechas futuras, solo buscar abiertos
      return this.obtenerSiguienteEstadoAbierto(fecha, estados);
    }
  }

  private async resolverEstadoCerrado(
    manager: EntityManager,
    ec: EstadoCuenta,
    fecha: Date,
    estados: EstadoCuenta[],
    tarjeta: TarjetaCredito
  ): Promise<{ ok: boolean; data?: EstadoCuenta; response?: ApiResponse<any> }> {
    const siguienteEstado = this.obtenerSiguienteEstadoAbiertoDesde(ec, estados);

    if (!siguienteEstado) {
      // Crear nuevo estado para el mes siguiente
      const fechaSiguiente = new Date(fecha);
      fechaSiguiente.setMonth(fechaSiguiente.getMonth() + 1);
      const nuevoEstado = await this.estadoCuentaService.ensureEstadoParaMes(manager, tarjeta, fechaSiguiente);
      this.actualizarEstadoEnLista(estados, nuevoEstado);
      return { ok: true, data: nuevoEstado };
    }

    return { ok: true, data: siguienteEstado };
  }

  // ===================== BÚSQUEDA DE ESTADOS =====================

  private buscarEstadoEnMemoria(
    fecha: Date,
    estados: EstadoCuenta[],
    permitirCerrados: boolean = false
  ): EstadoCuenta | undefined {
    for (const e of estados) {
      if (!permitirCerrados && e.estado === 'cerrado') continue;

      const ini = new Date(e.inicio_periodo);
      const fin = new Date(e.fin_periodo);
      if (fecha > ini && fecha <= fin) return e;
    }
    return undefined;
  }

  private async buscarEstadoEnBD(
    manager: EntityManager,
    tarjetaId: number,
    fecha: Date
  ): Promise<EstadoCuenta | undefined> {
    const todos = await manager.getRepository(EstadoCuenta).find({
      where: { tarjeta_id: tarjetaId },
      order: { inicio_periodo: 'ASC' },
    });

    for (const e of todos) {
      const ini = new Date(e.inicio_periodo);
      const fin = new Date(e.fin_periodo);
      if (fecha > ini && fecha <= fin) return e;
    }

    return undefined;
  }

  private obtenerSiguienteEstadoAbierto(fecha: Date, estados: EstadoCuenta[]): EstadoCuenta | undefined {
    const sorted = [...estados].sort((a, b) => new Date(a.fin_periodo).getTime() - new Date(b.fin_periodo).getTime());
    for (const e of sorted) {
      if (e.estado === 'abierto' && new Date(e.fin_periodo) > fecha) return e;
    }
    return undefined;
  }

  private obtenerSiguienteEstadoAbiertoDesde(actual: EstadoCuenta, estados: EstadoCuenta[]): EstadoCuenta | undefined {
    const idx = estados.findIndex((e) => e.id === actual.id);
    for (let i = idx + 1; i < estados.length; i++) {
      if (estados[i].estado !== 'cerrado') return estados[i];
    }
    return undefined;
  }

  // ===================== GESTIÓN DE LISTA DE ESTADOS =====================

  private actualizarEstadoEnLista(estados: EstadoCuenta[], nuevoEstado: EstadoCuenta): void {
    estados.push(nuevoEstado);
    estados.sort((a, b) => new Date(a.fin_periodo).getTime() - new Date(b.fin_periodo).getTime());
  }

  // ===================== CREACIÓN DE CUOTAS =====================

  private crearCuota(
    gastoId: number,
    estado: EstadoCuenta,
    numeroInicial: number,
    indice: number,
    fecha: Date,
    monto: number,
    moneda: Moneda
  ): Cuota {
    return this.cuotaRepo.create({
      gasto_id: gastoId,
      estado_id: estado.id,
      numero: numeroInicial + indice,
      fecha_cuota: fecha,
      monto_cuota: monto,
      moneda,
    });
  }

  private async guardarCuotas(manager: EntityManager, cuotas: Cuota[], gastoId: number): Promise<ApiResponse<Cuota[]>> {
    try {
      const saved = await manager.save(Cuota, cuotas);
      return ApiResponseBuilder.success(saved, `Se crearon ${saved.length} cuota(s) para el gasto ${gastoId}`);
    } catch (error: any) {
      return ApiResponseBuilder.error(500, `Error al crear cuotas: ${error.message}`);
    }
  }

  // ===================== UTILIDADES DE FECHAS =====================

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
