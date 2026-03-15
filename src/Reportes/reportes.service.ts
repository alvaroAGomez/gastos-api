import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gasto } from 'src/Gasto/gasto.entity';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { Categoria } from 'src/Categoria/categoria.entity';
import { Cuota } from 'src/Cuota/cuota.entity';
import { TipoGasto } from 'src/Gasto/enums/tipo-gasto.enum';
import { GraficoTortaDto } from './dto/grafico-torta.dto';
import { GraficoBarrasDto } from './dto/grafico-barras.dto';
import { GraficoLineaDto } from './dto/grafico-linea.dto';
import { FiltroReportesDto } from './dto/filtro-reportes.dto';
import { ReportesMapperHelper } from 'src/common/mappers/reportes.mapper';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Gasto) private gastoRepo: Repository<Gasto>,
    @InjectRepository(TarjetaCredito) private tarjetaRepo: Repository<TarjetaCredito>,
    @InjectRepository(Categoria) private categoriaRepo: Repository<Categoria>,
    @InjectRepository(Cuota) private cuotaRepo: Repository<Cuota>
  ) {}

  /**
   * Obtener gráfico de torta con gastos por categoría
   */
  async obtenerGastoPorCategoria(
    usuarioId: number,
    tarjetaId: number,
    filtros: FiltroReportesDto
  ): Promise<GraficoTortaDto> {
    const year = filtros.año || new Date().getFullYear();
    const month = filtros.mes;

    let query = this.gastoRepo
      .createQueryBuilder('gasto')
      .leftJoinAndSelect('gasto.categoria', 'categoria')
      .where('gasto.usuario_id = :usuarioId', { usuarioId })
      .andWhere('gasto.tarjeta_id = :tarjetaId', { tarjetaId })
      .andWhere('YEAR(gasto.fecha_compra) = :year', { year });

    if (month) {
      query = query.andWhere('MONTH(gasto.fecha_compra) = :month', { month });
    }

    if (filtros.categoriaId) {
      query = query.andWhere('gasto.categoria_id = :categoriaId', { categoriaId: filtros.categoriaId });
    }

    // Filtrar por tipo de gasto si es especificado
    if (filtros.tipoGasto) {
      if (filtros.tipoGasto === TipoGasto.CUOTAS) {
        query = query.andWhere('gasto.debito_config_id IS NULL');
      } else if (filtros.tipoGasto === TipoGasto.DEBITO) {
        query = query.andWhere('gasto.debito_config_id IS NOT NULL');
      } else if (filtros.tipoGasto === TipoGasto.NORMAL) {
        query = query.andWhere('gasto.debito_config_id IS NULL');
      }
    }

    const gastos = await query.getMany();

    // Use mapper helper to transform gastos into Chart.js format
    return ReportesMapperHelper.mapToGraficoTorta(gastos);
  }

  /**
   * Obtener gráfico de barras con gasto actual vs futuro (mensual)
   */
  async obtenerActualVsFuturo(
    usuarioId: number,
    tarjetaId: number,
    meses: number = 6,
    año?: number
  ): Promise<GraficoBarrasDto> {
    // Limitar a máximo 12 meses
    const cantidadMeses = Math.min(meses, 12);
    const ahora = new Date();
    const year = año || ahora.getFullYear();

    // Obtener gastos normales (gasto actual vencido)
    const gastosActualesQuery = this.gastoRepo
      .createQueryBuilder('gasto')
      .where('gasto.usuario_id = :usuarioId', { usuarioId })
      .andWhere('gasto.tarjeta_id = :tarjetaId', { tarjetaId })
      .andWhere('YEAR(gasto.fecha_compra) = :year', { year });

    const gastosActuales = await gastosActualesQuery.getMany();

    // Obtener cuotas pendientes (gasto futuro)
    const cuotasPendientesQuery = this.cuotaRepo
      .createQueryBuilder('cuota')
      .leftJoin('cuota.gasto', 'gasto')
      .where('gasto.usuario_id = :usuarioId', { usuarioId })
      .andWhere('gasto.tarjeta_id = :tarjetaId', { tarjetaId })
      .andWhere('YEAR(cuota.fecha_cuota) = :year', { year });

    const cuotasPendientes = await cuotasPendientesQuery.getMany();

    // Use mapper helper to transform into Chart.js format
    return ReportesMapperHelper.mapToActualVsFuturo(gastosActuales, cuotasPendientes, cantidadMeses, year);
  }

  /**
   * Obtener gráfico de línea con evolución total de gastos (últimos N meses)
   * Muestra la suma de todos los gastos (normales + cuotas) mes a mes
   */
  async obtenerEvolucionGastos(usuarioId: number, tarjetaId?: number, meses: number = 6): Promise<GraficoLineaDto> {
    // Limitar a máximo 12 meses
    const cantidadMeses = Math.min(meses, 12);
    const ahora = new Date();
    const fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth() - cantidadMeses, 1);

    // Crear mapa de meses
    const mesesMap = new Map<string, number>();
    for (let i = 0; i < cantidadMeses; i++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - cantidadMeses + i + 1, 1);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      mesesMap.set(mesKey, 0);
    }

    // Obtener gastos normales
    let gastoQuery = this.gastoRepo
      .createQueryBuilder('gasto')
      .where('gasto.usuario_id = :usuarioId', { usuarioId })
      .andWhere('gasto.fecha_compra >= :fechaDesde', { fechaDesde });

    if (tarjetaId) {
      gastoQuery = gastoQuery.andWhere('gasto.tarjeta_id = :tarjetaId', { tarjetaId });
    }

    const gastos = await gastoQuery.getMany();

    // Obtener cuotas
    let cuotaQuery = this.cuotaRepo
      .createQueryBuilder('cuota')
      .leftJoin('cuota.gasto', 'gasto')
      .where('gasto.usuario_id = :usuarioId', { usuarioId })
      .andWhere('cuota.fecha_cuota >= :fechaDesde', { fechaDesde });

    if (tarjetaId) {
      cuotaQuery = cuotaQuery.andWhere('gasto.tarjeta_id = :tarjetaId', { tarjetaId });
    }

    const cuotas = await cuotaQuery.getMany();

    // Use mapper helper to transform into Chart.js format
    return ReportesMapperHelper.mapToEvolucionGastos(gastos, cuotas, mesesMap);
  }

  /**
   * Obtener gráfico de barras con gastos por tarjeta
   */
  async obtenerGastoPorTarjeta(usuarioId: number, año?: number, mes?: number): Promise<GraficoBarrasDto> {
    const year = año || new Date().getFullYear();
    const month = mes;

    let query = this.gastoRepo
      .createQueryBuilder('gasto')
      .leftJoinAndSelect('gasto.tarjeta', 'tarjeta')
      .where('gasto.usuario_id = :usuarioId', { usuarioId })
      .andWhere('YEAR(gasto.fecha_compra) = :year', { year });

    if (month) {
      query = query.andWhere('MONTH(gasto.fecha_compra) = :month', { month });
    }

    const gastos = await query.getMany();

    // Use mapper helper to transform gastos into Chart.js format
    return ReportesMapperHelper.mapToGastoPorTarjeta(gastos);
  }
}
