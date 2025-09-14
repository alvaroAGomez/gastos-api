// src/modules/gastos/gastos.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cuota } from 'src/Cuota/cuota.entity';
import { EstadoCuenta } from 'src/EstadoCuenta/estado-cuenta.entity';
import { DebitoConfigService } from 'src/DebitoConfig/debito-config.service';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { Repository, DataSource } from 'typeorm';
import { Gasto } from './gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { ApiResponse, ApiResponseBuilder } from '../common/response/api-response.builder';
import { CuotaService } from 'src/Cuota/cuota.service';
import { EstadoCuentaService } from 'src/EstadoCuenta/estado-cuenta.service';

export type Moneda = 'ARS' | 'USD';
export type TipoGasto = 'normal' | 'cuotas' | 'debito';

@Injectable()
export class GastosService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Gasto) private readonly gastoRepo: Repository<Gasto>,
    @InjectRepository(Cuota) private readonly cuotaRepo: Repository<Cuota>,
    @InjectRepository(EstadoCuenta) private readonly estadoRepo: Repository<EstadoCuenta>,
    @InjectRepository(TarjetaCredito) private readonly tarjetaRepo: Repository<TarjetaCredito>,
    private readonly debitoConfigService: DebitoConfigService,
    private readonly cuotaService: CuotaService,
    private readonly estadoCuentaService: EstadoCuentaService
  ) {}

  // ---------- Entrada única ----------
  async createGasto(dto: CreateGastoDto): Promise<ApiResponse<any>> {
    try {
      if (dto.tipo === 'debito') return this.createGastoDebito(dto);
      if (dto.tipo === 'cuotas') {
        if (!dto.cuotas || dto.cuotas < 2) {
          return ApiResponseBuilder.error(400, 'Para cuotas, "cuotas" >= 2');
        }
        return this.createGastoCuotas(dto);
      }
      return this.createGastoNormal(dto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        return ApiResponseBuilder.error(400, error.message);
      }
      if (error instanceof NotFoundException) {
        return ApiResponseBuilder.error(404, error.message);
      }
      return ApiResponseBuilder.error(500, error.message);
    }
  }

  private async createGastoNormal(dto: CreateGastoDto): Promise<ApiResponse<any>> {
    return this.ds.transaction(async (m) => {
      const tarjeta = await this.findTarjetaDelUsuario(m, dto.tarjetaId, dto.usuarioId);

      const fecha = new Date(dto.fechaCompra);

      // 1) Asegurar el estado del mes de la compra (on-demand)
      const ecCreado = await this.estadoCuentaService.ensureEstadoParaMes(m, tarjeta, fecha);

      // 2) Refrescar estados y resolver EC
      const estados = await this.findEstadosOrdenados(m, tarjeta.id);
      let ec = this.estadoParaFecha(fecha, estados) || ecCreado;

      if (ec.estado === 'cerrado') {
        const siguienteEstado = this.siguienteAbierto(ec, estados);
        if (!siguienteEstado) {
          // Crear un nuevo estado abierto para el mes siguiente
          const fechaSiguiente = new Date(fecha);
          fechaSiguiente.setMonth(fechaSiguiente.getMonth() + 1);
          ec = await this.estadoCuentaService.ensureEstadoParaMes(m, tarjeta, fechaSiguiente);
        } else {
          ec = siguienteEstado;
        }
      }

      // 3) Crear gasto
      const gasto = this.gastoRepo.create({
        usuario_id: dto.usuarioId,
        tarjeta_id: dto.tarjetaId,
        categoria_id: dto.categoriaId ?? null,
        estado_id: ec.id,
        descripcion: dto.descripcion ?? null,
        monto: dto.monto,
        moneda: dto.moneda,
        fecha_compra: fecha,
        es_debito_auto: false,
        debito_config_id: null,
      });
      const { id: gasto_id } = await m.save(gasto);

      // 4) Delegar creación de 1 cuota
      const respCuotas = await this.cuotaService.createCuotasForGasto(m, {
        gastoId: gasto_id,
        moneda: dto.moneda,
        montoTotal: dto.monto,
        cantidad: 1,
        fechaCompra: fecha,
        estados,
        ecCompra: ec,
        numeroInicial: 1,
      });
      if (!respCuotas.ok) return respCuotas;

      return ApiResponseBuilder.success(
        { gastoId: gasto_id, estadoId: ec.id, cuotas: respCuotas.data.length },
        'Gasto creado exitosamente'
      );
    });
  }

  private async createGastoCuotas(dto: CreateGastoDto): Promise<ApiResponse<any>> {
    return this.ds.transaction(async (m) => {
      // 1) validar usuario/tarjeta y crear EC si no existe
      const tarjeta = await this.findTarjetaDelUsuario(m, dto.tarjetaId, dto.usuarioId);
      const fechaCompra = new Date(dto.fechaCompra);

      // Asegurar el estado del mes de la compra
      const ecCreado = await this.estadoCuentaService.ensureEstadoParaMes(m, tarjeta, fechaCompra);

      const estados = await this.findEstadosOrdenados(m, tarjeta.id);
      let ecCompra = this.estadoParaFecha(fechaCompra, estados) || ecCreado;

      if (ecCompra.estado === 'cerrado') {
        const siguienteEstado = this.siguienteAbierto(ecCompra, estados);
        if (!siguienteEstado) {
          const fechaSiguiente = new Date(fechaCompra);
          fechaSiguiente.setMonth(fechaSiguiente.getMonth() + 1);
          ecCompra = await this.estadoCuentaService.ensureEstadoParaMes(m, tarjeta, fechaSiguiente);
        } else {
          ecCompra = siguienteEstado;
        }
      }

      // 2) crear el gasto “madre” (solo valida datos del gasto)
      const gasto = m.getRepository(Gasto).create({
        usuario_id: dto.usuarioId,
        tarjeta_id: dto.tarjetaId,
        categoria_id: dto.categoriaId ?? null,
        estado_id: ecCompra.id,
        descripcion: dto.descripcion ?? null,
        monto: dto.monto,
        moneda: dto.moneda,
        fecha_compra: fechaCompra,
        es_debito_auto: false,
        debito_config_id: null,
      });
      const { id: gasto_id } = await m.getRepository(Gasto).save(gasto);

      // 3) delegar TODA la lógica de cuotas

      const respCuotas = await this.cuotaService.crearPlanParaGasto(m, {
        gastoId: gasto_id,
        tarjetaId: dto.tarjetaId,
        moneda: dto.moneda,
        montoTotal: dto.monto,
        cantidad: dto.cuotas!,
        fechaCompra: new Date(dto.fechaCompra),
        modo: 'crear',
      });
      try {
        return ApiResponseBuilder.success(
          { gastoId: gasto_id, cuotas: respCuotas.data.length },
          'Gasto en cuotas creado exitosamente'
        );
      } catch (error) {
        return ApiResponseBuilder.error(400, 'Error al crear cuotas:' + error.message);
      }
    });
  }

  private async createGastoDebito(dto: CreateGastoDto): Promise<ApiResponse<any>> {
    return this.ds.transaction(async (m) => {
      const tarjeta = await this.findTarjetaDelUsuario(m, dto.tarjetaId, dto.usuarioId);
      const fecha = new Date(dto.fechaCompra);

      // Asegurar el estado del mes de la compra
      const ecCreado = await this.estadoCuentaService.ensureEstadoParaMes(m, tarjeta, fecha);

      const estados = await this.findEstadosOrdenados(m, tarjeta.id);
      let ec = this.estadoParaFecha(fecha, estados) || ecCreado;

      if (ec.estado === 'cerrado') {
        const siguienteEstado = this.siguienteAbierto(ec, estados);
        if (!siguienteEstado) {
          const fechaSiguiente = new Date(fecha);
          fechaSiguiente.setMonth(fechaSiguiente.getMonth() + 1);
          ec = await this.estadoCuentaService.ensureEstadoParaMes(m, tarjeta, fechaSiguiente);
        } else {
          ec = siguienteEstado;
        }
      }

      // 1. Crear la configuración de débito
      const configResponse = await this.debitoConfigService.createDebitoConfig({
        usuarioId: dto.usuarioId,
        tarjetaId: dto.tarjetaId,
        categoriaId: dto.categoriaId,
        descripcion: dto.descripcion,
        monto: dto.monto,
        moneda: dto.moneda,
        fechaSuscripcion: new Date(dto.fechaCompra),
      });

      if (!configResponse.ok) {
        return configResponse;
      }

      // 2. Crear el gasto asociado a la config
      const gasto = this.gastoRepo.create({
        usuario_id: dto.usuarioId,
        tarjeta_id: dto.tarjetaId,
        categoria_id: dto.categoriaId ?? null,
        estado_id: ec.id,
        descripcion: dto.descripcion ?? 'Débito automático',
        monto: dto.monto,
        moneda: dto.moneda,
        fecha_compra: new Date(dto.fechaCompra),
        es_debito_auto: true,
        debito_config_id: configResponse.data.configId,
      });
      const { id } = await m.save(gasto);

      return ApiResponseBuilder.success(
        {
          gastoId: id,
          estadoId: ec.id,
          configId: configResponse.data.configId,
        },
        'Gasto por débito y suscripción creados exitosamente'
      );
    });
  }

  /** Usado por el scheduler: crea el gasto del mes desde la configuración */
  async createGastoFromDebitoConfig(debitoConfigId: number, fechaOpcional?: string): Promise<ApiResponse<any>> {
    return this.ds.transaction(async (m) => {
      const dc = await this.debitoConfigService.getActiveConfig(debitoConfigId);
      if (!dc) {
        return ApiResponseBuilder.error(404, 'Configuración de débito no encontrada o inactiva');
      }

      // Fecha = día de la suscripción en el mes actual (o en la fecha que pases)
      const base = fechaOpcional ? new Date(fechaOpcional) : new Date();
      const y = base.getUTCFullYear();
      const mo = base.getUTCMonth();
      const diaBase = new Date(dc.fecha_suscripcion).getUTCDate();
      const last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
      const dia = Math.min(diaBase, last);
      const fechaCompra = new Date(Date.UTC(y, mo, dia));

      // Obtener la tarjeta para ensureEstadoParaMes
      const tarjeta = await this.tarjetaRepo.findOne({ where: { id: dc.tarjeta_id } });
      if (!tarjeta) {
        return ApiResponseBuilder.error(404, 'Tarjeta no encontrada');
      }

      // Asegurar el estado del mes de la compra
      const ecCreado = await this.estadoCuentaService.ensureEstadoParaMes(m, tarjeta, fechaCompra);

      const estados = await this.findEstadosOrdenados(m, dc.tarjeta_id);
      let ec = this.estadoParaFecha(fechaCompra, estados) || ecCreado;

      if (ec.estado === 'cerrado') {
        const siguienteEstado = this.siguienteAbierto(ec, estados);
        if (!siguienteEstado) {
          const fechaSiguiente = new Date(fechaCompra);
          fechaSiguiente.setMonth(fechaSiguiente.getMonth() + 1);
          ec = await this.estadoCuentaService.ensureEstadoParaMes(m, tarjeta, fechaSiguiente);
        } else {
          ec = siguienteEstado;
        }
      }

      const gasto = this.gastoRepo.create({
        usuario_id: dc.usuario_id,
        tarjeta_id: dc.tarjeta_id,
        categoria_id: dc.categoria_id ?? null,
        estado_id: ec.id,
        descripcion: dc.descripcion,
        monto: Number(dc.monto),
        moneda: dc.moneda as any,
        fecha_compra: fechaCompra,
        es_debito_auto: true,
        debito_config_id: dc.id,
      });

      try {
        const { id } = await m.save(gasto);
        return ApiResponseBuilder.success(
          { gastoId: id, estadoId: ec.id },
          'Gasto por débito automático creado exitosamente'
        );
      } catch (e: any) {
        if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062) {
          return ApiResponseBuilder.success({ gastoId: 0, estadoId: ec.id, note: 'ya-existia' }, 'El gasto ya existe');
        }
        throw e;
      }
    });
  }

  // ---------- helpers ----------
  private async findTarjetaDelUsuario(m: any, tarjetaId: number, usuarioId: number) {
    const tarjeta = await this.tarjetaRepo.findOne({
      where: { id: tarjetaId },
      relations: ['usuario'],
    });
    if (!tarjeta || (tarjeta.usuario as any)?.id !== usuarioId) {
      throw new NotFoundException('Tarjeta no encontrada o no pertenece al usuario');
    }
    return tarjeta;
  }

  private async findEstadosOrdenados(m: any, tarjetaId: number) {
    return this.estadoRepo.find({
      where: { tarjeta_id: tarjetaId },
      order: { fecha_cierre: 'ASC' },
    });
  }

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
}
