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
    private readonly debitoConfigService: DebitoConfigService
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

  // ---------- Casos ----------
  private async createGastoNormal(dto: CreateGastoDto): Promise<ApiResponse<any>> {
    return this.ds.transaction(async (m) => {
      const tarjeta = await this.findTarjetaDelUsuario(m, dto.tarjetaId, dto.usuarioId);
      const estados = await this.findEstadosOrdenados(m, tarjeta.id);

      const fecha = new Date(dto.fechaCompra);
      let ec = this.estadoParaFecha(fecha, estados);
      if (!ec) {
        return ApiResponseBuilder.error(400, 'No hay estado de cuenta para esa fecha');
      }
      if (ec.estado === 'cerrado') {
        ec = this.siguienteAbierto(ec, estados) ?? this.failNoAbierto();
      }

      const gasto = this.gastoRepo.create({
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
      const { id: gasto_id } = await m.save(gasto);

      // (opcional) cuota #1 por homogeneidad visual
      const cuota = this.cuotaRepo.create({
        gasto_id,
        estado_id: ec.id,
        numero: 1,
        fecha_cuota: new Date(dto.fechaCompra),
        monto_cuota: dto.monto,
        moneda: dto.moneda,
      });
      await m.save(cuota);

      return ApiResponseBuilder.success({ gastoId: gasto_id, estadoId: ec.id }, 'Gasto creado exitosamente');
    });
  }

  private async createGastoCuotas(dto: CreateGastoDto): Promise<ApiResponse<any>> {
    return this.ds.transaction(async (m) => {
      const tarjeta = await this.findTarjetaDelUsuario(m, dto.tarjetaId, dto.usuarioId);
      const estados = await this.findEstadosOrdenados(m, tarjeta.id);

      const fechaCompra = new Date(dto.fechaCompra);
      let ecCompra = this.estadoParaFecha(fechaCompra, estados);
      if (!ecCompra) {
        return ApiResponseBuilder.error(400, 'No hay estado para esa fecha');
      }
      if (ecCompra.estado === 'cerrado') {
        ecCompra = this.siguienteAbierto(ecCompra, estados) ?? this.failNoAbierto();
      }

      const gasto = this.gastoRepo.create({
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
      const { id: gasto_id } = await m.save(gasto);

      const n = dto.cuotas!;
      const montoCuota = this.redondeo(dto.monto / n);
      const fechas = this.generarFechasCuotas(fechaCompra, estados, n, ecCompra);

      for (let i = 0; i < n; i++) {
        const f = fechas[i];
        let ec = this.estadoParaFecha(f, estados);
        if (!ec) {
          return ApiResponseBuilder.error(400, `No hay estado para cuota #${i + 1}`);
        }
        if (ec.estado === 'cerrado') {
          ec = this.siguienteAbierto(ec, estados) ?? this.failNoAbierto();
        }

        const c = this.cuotaRepo.create({
          gasto_id,
          estado_id: ec.id,
          numero: i + 1,
          fecha_cuota: f,
          monto_cuota: montoCuota,
          moneda: dto.moneda,
        });
        await m.save(c);
      }

      return ApiResponseBuilder.success({ gastoId: gasto_id, cuotas: n }, 'Gasto en cuotas creado exitosamente');
    });
  }

  private async createGastoDebito(dto: CreateGastoDto): Promise<ApiResponse<any>> {
    return this.ds.transaction(async (m) => {
      const tarjeta = await this.findTarjetaDelUsuario(m, dto.tarjetaId, dto.usuarioId);
      const estados = await this.findEstadosOrdenados(m, tarjeta.id);

      const fecha = new Date(dto.fechaCompra);
      let ec = this.estadoParaFecha(fecha, estados);
      if (!ec) {
        return ApiResponseBuilder.error(400, 'No hay estado de cuenta para esa fecha');
      }
      if (ec.estado === 'cerrado') {
        ec = this.siguienteAbierto(ec, estados) ?? this.failNoAbierto();
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

      const estados = await this.findEstadosOrdenados(m, dc.tarjeta_id);
      let ec = this.estadoParaFecha(fechaCompra, estados);
      if (!ec) {
        return ApiResponseBuilder.error(400, 'No hay estado para esa fecha');
      }
      if (ec.estado === 'cerrado') {
        ec = this.siguienteAbierto(ec, estados) ?? this.failNoAbierto();
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
