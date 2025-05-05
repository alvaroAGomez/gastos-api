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
      .where('gasto.usuarioId = :userId', { userId })
      .andWhere('YEAR(cuota.fechaVencimiento) = :year', { year });

    if (tarjetaId) query.andWhere('gasto.tarjetaCredito = :tarjetaId', { tarjetaId });

    if (categorias && Array.isArray(categorias) && categorias.length > 0) {
      query.andWhere('gasto.categoria IN (:...categorias)', { categorias });
    }

    const rows = await query
      .select(['MONTH(cuota.fechaVencimiento) as mes', 'SUM(cuota.montoCuota) as total'])
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
      .where('gasto.usuarioId = :userId', { userId })
      .andWhere('YEAR(cuota.fechaVencimiento) = :year', { year });

    if (month) query.andWhere('MONTH(cuota.fechaVencimiento) = :month', { month });
    if (tarjetaId) query.andWhere('gasto.tarjetaCredito = :tarjetaId', { tarjetaId });

    if (categorias && Array.isArray(categorias) && categorias.length > 0) {
      query.andWhere('gasto.categoria IN (:...categorias)', { categorias });
    }

    const rows = await query
      .select(['categoria.nombre as categoria', 'SUM(cuota.montoCuota) as total'])
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
      .where('gasto.usuarioId = :userId', { userId })
      .andWhere('YEAR(cuota.fechaVencimiento) = :year', { year });

    if (tarjetaId) query.andWhere('gasto.tarjetaCredito = :tarjeta', { tarjeta: tarjetaId });

    if (categorias && Array.isArray(categorias) && categorias.length > 0) {
      query.andWhere('gasto.categoria IN (:...categorias)', { categorias });
    } else if (categorias) {
      query.andWhere('gasto.categoria = :categoria', { categoria: categorias });
    }

    const rows = await query
      .select(['MONTH(cuota.fechaVencimiento) as mes', 'SUM(cuota.montoCuota) as total'])
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
