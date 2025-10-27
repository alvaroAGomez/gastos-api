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
import { FiltroGastosDashboardDto } from './dto/gasto-dashboard-filtro.dto';
import { FiltroGastosCompletosDto } from './dto/gasto-filtro-completo.dto';

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
      console.log('🔍 Creando plan de cuotas:', {
        gastoId: gasto_id,
        tarjetaId: dto.tarjetaId,
        cantidad: dto.cuotas,
        fechaCompra: dto.fechaCompra,
      });
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
      console.log('🔍 Respuesta del CuotaService:', respCuotas);

      if (!respCuotas.ok) {
        console.error('❌ Error en CuotaService:', respCuotas.error);
        return respCuotas; // ✅ Retorna el error del CuotaService
      }
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

  // Helper para convertir fecha de manera segura
  private formatearFecha(fecha: any): string {
    try {
      if (!fecha) return '';

      if (fecha instanceof Date) {
        return fecha.toISOString().split('T')[0];
      }

      // Si es string, convertir a Date primero
      if (typeof fecha === 'string') {
        return new Date(fecha).toISOString().split('T')[0];
      }

      // Si no es ni Date ni string, intentar conversión
      return new Date(fecha).toISOString().split('T')[0];
    } catch (error) {
      console.error('Error al formatear fecha:', fecha, error);
      return '';
    }
  }

  async getGastosDashboard(usuarioId: number, filtros: FiltroGastosDashboardDto) {
    try {
      // Calcular fechas del mes actual si no se proporcionan
      const ahora = new Date();
      const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const ultimoDiaMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

      const fechaDesde = filtros.fechaDesde || primerDiaMes.toISOString().split('T')[0];
      const fechaHasta = filtros.fechaHasta || ultimoDiaMes.toISOString().split('T')[0];

      const qb = this.gastoRepo
        .createQueryBuilder('gasto')
        .innerJoinAndSelect('gasto.categoria', 'categoria')
        .innerJoinAndSelect('gasto.tarjeta', 'tarjeta')
        .innerJoinAndSelect('tarjeta.banco', 'banco')
        .leftJoinAndSelect('gasto.cuotas', 'cuotas')
        .where('gasto.usuario_id = :usuarioId', { usuarioId })
        .andWhere('gasto.fecha_compra >= :fechaDesde', { fechaDesde })
        .andWhere('gasto.fecha_compra <= :fechaHasta', { fechaHasta });

      if (filtros.tarjetaId) {
        qb.andWhere('gasto.tarjeta_id = :tarjetaId', { tarjetaId: filtros.tarjetaId });
      }

      if (filtros.categoriaId) {
        qb.andWhere('gasto.categoria_id = :categoriaId', { categoriaId: filtros.categoriaId });
      }

      const limit = filtros.limit || 10;
      qb.orderBy('gasto.fecha_compra', 'DESC').addOrderBy('gasto.id', 'DESC').take(limit);

      const gastos = await qb.getMany();

      // Mapear a DTO usando el helper
      const gastosDto = gastos.map((gasto) => ({
        id: gasto.id,
        fecha: this.formatearFecha(gasto.fecha_compra),
        descripcion: gasto.descripcion,
        monto: Number(gasto.monto),
        moneda: gasto.moneda,
        categoria: {
          id: gasto.categoria.id,
          nombre: gasto.categoria.nombre,
          color_hex: gasto.categoria.color_hex,
          icono: gasto.categoria.icono,
        },
        tarjeta: {
          id: gasto.tarjeta.id,
          nombre: gasto.tarjeta.nombre,
          banco: {
            id: gasto.tarjeta.banco.id,
            nombre: gasto.tarjeta.banco.nombre,
          },
        },
        totalCuotas: gasto.cuotas?.length || 1,
        esDebitoAuto: gasto.es_debito_auto,
      }));

      return ApiResponseBuilder.success(
        {
          gastos: gastosDto,
          periodo: {
            desde: fechaDesde,
            hasta: fechaHasta,
            esFiltroPorDefecto: !filtros.fechaDesde && !filtros.fechaHasta,
          },
        },
        'Gastos del dashboard obtenidos exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener gastos del dashboard:', error);
      return ApiResponseBuilder.error(500, 'Error al obtener los gastos del dashboard');
    }
  }

  // ...existing code...

  async getGastosCompletos(usuarioId: number, filtros: FiltroGastosCompletosDto) {
    try {
      // Consulta para obtener CUOTAS en lugar de gastos
      const qb = this.cuotaRepo
        .createQueryBuilder('cuota')
        .innerJoinAndSelect('cuota.gasto', 'gasto')
        .innerJoinAndSelect('gasto.categoria', 'categoria')
        .innerJoinAndSelect('gasto.tarjeta', 'tarjeta')
        .innerJoinAndSelect('tarjeta.banco', 'banco')
        .where('gasto.usuario_id = :usuarioId', { usuarioId });

      // Filtros de fecha basados en la fecha de la CUOTA, no del gasto
      if (filtros.mes) {
        const [año, mes] = filtros.mes.split('-');
        const fechaDesde = `${año}-${mes}-01`;
        const ultimoDia = new Date(parseInt(año), parseInt(mes), 0).getDate();
        const fechaHasta = `${año}-${mes}-${ultimoDia.toString().padStart(2, '0')}`;

        qb.andWhere('cuota.fecha_cuota >= :fechaDesde', { fechaDesde }).andWhere('cuota.fecha_cuota <= :fechaHasta', {
          fechaHasta,
        });
      } else {
        if (filtros.fechaDesde) {
          qb.andWhere('cuota.fecha_cuota >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
        }
        if (filtros.fechaHasta) {
          qb.andWhere('cuota.fecha_cuota <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
        }
      }

      // Otros filtros
      if (filtros.tarjetaId) {
        qb.andWhere('gasto.tarjeta_id = :tarjetaId', { tarjetaId: filtros.tarjetaId });
      }

      if (filtros.categoriaId) {
        qb.andWhere('gasto.categoria_id = :categoriaId', { categoriaId: filtros.categoriaId });
      }

      // Ordenamiento basado en fecha de cuota
      const orderBy = filtros.orderBy || 'fecha';
      const orderDirection = filtros.orderDirection || 'DESC';

      switch (orderBy) {
        case 'fecha':
          qb.orderBy('cuota.fecha_cuota', orderDirection).addOrderBy('cuota.id', orderDirection);
          break;
        case 'monto':
          qb.orderBy('cuota.monto_cuota', orderDirection).addOrderBy('cuota.fecha_cuota', 'DESC');
          break;
        case 'descripcion':
          qb.orderBy('gasto.descripcion', orderDirection).addOrderBy('cuota.fecha_cuota', 'DESC');
          break;
        default:
          qb.orderBy('cuota.fecha_cuota', 'DESC').addOrderBy('cuota.id', 'DESC');
      }

      // Paginación
      const page = filtros.page || 1;
      const limit = filtros.limit || 20;
      const skip = (page - 1) * limit;

      // Obtener total para paginación
      const totalQuery = qb.clone();
      const total = await totalQuery.getCount();

      // Aplicar paginación
      qb.skip(skip).take(limit);

      const cuotas = await qb.getMany();

      // Para obtener el total de cuotas de cada gasto, necesitamos hacer una consulta adicional
      const gastosIds = [...new Set(cuotas.map((cuota) => cuota.gasto.id))];
      const cuotasPorGasto = await this.cuotaRepo
        .createQueryBuilder('cuota')
        .select('cuota.gasto_id', 'gastoId')
        .addSelect('COUNT(*)', 'totalCuotas')
        .where('cuota.gasto_id IN (:...gastosIds)', { gastosIds })
        .groupBy('cuota.gasto_id')
        .getRawMany();

      const cuotasMap = cuotasPorGasto.reduce((acc, item) => {
        acc[item.gastoId] = parseInt(item.totalCuotas);
        return acc;
      }, {});

      // Mapear a DTO - cada cuota individual
      const gastosDto = cuotas.map((cuota) => {
        const fechaCuota = cuota.fecha_cuota instanceof Date ? cuota.fecha_cuota : new Date(cuota.fecha_cuota);
        const totalCuotas = cuotasMap[cuota.gasto.id] || 1;

        // Generar descripción con info de cuota
        let descripcion = cuota.gasto.descripcion || '';
        if (totalCuotas > 1) {
          descripcion += ` (${cuota.numero}/${totalCuotas})`;
        }

        return {
          id: cuota.id, // ID de la cuota, no del gasto
          gastoId: cuota.gasto.id, // ID del gasto padre
          fecha: fechaCuota.toISOString().split('T')[0],
          descripcion: descripcion,
          categoria: {
            id: cuota.gasto.categoria.id,
            nombre: cuota.gasto.categoria.nombre,
            color_hex: cuota.gasto.categoria.color_hex,
            icono: cuota.gasto.categoria.icono,
          },
          monto: Number(cuota.monto_cuota), // Monto de la cuota individual
          montoTotal: Number(cuota.gasto.monto), // Monto total del gasto
          moneda: cuota.moneda,
          tarjeta: {
            id: cuota.gasto.tarjeta.id,
            nombre: cuota.gasto.tarjeta.nombre,
            banco: cuota.gasto.tarjeta.banco.nombre,
          },
          tipo: 'Crédito',
          totalCuotas: totalCuotas > 1 ? totalCuotas : undefined,
          cuotaActual: cuota.numero, // Número de esta cuota específica
          esDebitoAuto: cuota.gasto.es_debito_auto,
        };
      });

      const totalPages = Math.ceil(total / limit);

      return ApiResponseBuilder.success(
        {
          gastos: gastosDto, // En realidad son cuotas individuales
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
          filtros: {
            tarjetaId: filtros.tarjetaId,
            categoriaId: filtros.categoriaId,
            mes: filtros.mes,
            fechaDesde: filtros.fechaDesde,
            fechaHasta: filtros.fechaHasta,
          },
        },
        'Gastos obtenidos exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener gastos completos:', error);
      return ApiResponseBuilder.error(500, 'Error al obtener los gastos');
    }
  }
}
