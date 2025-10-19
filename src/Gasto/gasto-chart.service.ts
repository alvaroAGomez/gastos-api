import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuota } from 'src/Cuota/cuota.entity';
import { MESES } from 'src/common/constants/meses.const';
import { COLORS } from 'src/common/constants/colors';

@Injectable()
export class GastoChartService {
  constructor(@InjectRepository(Cuota) private cuotaRepo: Repository<Cuota>) {}

  async getBarMonthlyEvolutionData(userId: number, filtros?: any): Promise<{ chartData: any }> {
    const year = filtros.anio || new Date().getFullYear();
    const categorias = filtros.categoria;
    const tarjetaId = filtros.tarjeta;

    const query = this.cuotaRepo
      .createQueryBuilder('cuota')
      .leftJoin('cuota.gasto', 'gasto')
      .where('gasto.usuario_id = :userId', { userId })
      .andWhere('YEAR(cuota.fecha_cuota) = :year', { year });

    if (tarjetaId) query.andWhere('gasto.tarjeta_id = :tarjetaId', { tarjetaId });

    if (categorias && Array.isArray(categorias) && categorias.length > 0) {
      query.andWhere('gasto.categoria_id IN (:...categorias)', { categorias });
    }

    const rows = await query
      .select(['MONTH(cuota.fecha_cuota) as mes', 'SUM(cuota.monto_cuota) as total'])
      .groupBy('mes')
      .orderBy('mes', 'ASC')
      .getRawMany();

    const data = new Array(12).fill(0);
    rows.forEach((r) => {
      data[+r.mes - 1] = +r.total;
    });

    return {
      chartData: {
        labels: MESES,
        datasets: [
          {
            data,
            label: 'Total Gastado',
            backgroundColor: '#1976d2',
            borderRadius: 8,
          },
        ],
      },
    };
  }

  async getDoughnutCategoryData(userId: number, filtros?: any): Promise<{ chartData: any }> {
    const year = filtros.anio || new Date().getFullYear();
    const month = filtros.mes;
    const categorias = filtros.categoria;
    const tarjetaId = filtros.tarjeta;

    const query = this.cuotaRepo
      .createQueryBuilder('cuota')
      .leftJoin('cuota.gasto', 'gasto')
      .leftJoin('gasto.categoria', 'categoria')
      .where('gasto.usuario_id = :userId', { userId })
      .andWhere('YEAR(cuota.fecha_cuota) = :year', { year });

    if (month) query.andWhere('MONTH(cuota.fecha_cuota) = :month', { month });
    if (tarjetaId) query.andWhere('gasto.tarjeta_id = :tarjetaId', { tarjetaId });

    if (categorias && Array.isArray(categorias) && categorias.length > 0) {
      query.andWhere('gasto.categoria_id IN (:...categorias)', { categorias });
    }

    const rows = await query
      .select(['categoria.nombre as categoria', 'SUM(cuota.monto_cuota) as total'])
      .groupBy('categoria.nombre')
      .orderBy('total', 'DESC')
      .getRawMany();

    const labels = rows.map((r) => r.categoria || 'Sin categoría');
    const data = rows.map((r) => Number(r.total));

    return {
      chartData: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: COLORS.slice(0, labels.length),
          },
        ],
      },
    };
  }

  async getLineMonthlyEvolutionData(userId: number, filtros: any): Promise<{ chartData: any; chartOptions: any }> {
    const year = filtros.anio || new Date().getFullYear();
    const categorias = filtros.categoria;
    const tarjetaId = filtros.tarjeta;

    const query = this.cuotaRepo
      .createQueryBuilder('cuota')
      .leftJoin('cuota.gasto', 'gasto')
      .where('gasto.usuario_id = :userId', { userId })
      .andWhere('YEAR(cuota.fecha_cuota) = :year', { year });

    if (tarjetaId) query.andWhere('gasto.tarjeta_id = :tarjeta', { tarjeta: tarjetaId });

    if (categorias && Array.isArray(categorias) && categorias.length > 0) {
      query.andWhere('gasto.categoria_id IN (:...categorias)', { categorias });
    } else if (categorias) {
      query.andWhere('gasto.categoria_id = :categoria', { categoria: categorias });
    }

    const rows = await query
      .select(['MONTH(cuota.fecha_cuota) as mes', 'SUM(cuota.monto_cuota) as total'])
      .groupBy('mes')
      .orderBy('mes', 'ASC')
      .getRawMany();

    const data = new Array(12).fill(0);
    rows.forEach((r) => {
      data[+r.mes - 1] = +r.total;
    });

    return {
      chartData: {
        labels: MESES,
        datasets: [
          {
            data,
            label: 'Total Gastado',
            borderColor: '#1976d2',
            backgroundColor: '#90caf9',
            fill: false,
            tension: 0.3,
          },
        ],
      },
      chartOptions: { responsive: true },
    };
  }
}
