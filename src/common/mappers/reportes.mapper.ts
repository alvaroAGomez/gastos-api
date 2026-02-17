import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Gasto } from 'src/Gasto/gasto.entity';
import { Cuota } from 'src/Cuota/cuota.entity';
import { GraficoTortaDto } from 'src/Reportes/dto/grafico-torta.dto';
import { GraficoBarrasDto } from 'src/Reportes/dto/grafico-barras.dto';
import { GraficoLineaDto } from 'src/Reportes/dto/grafico-linea.dto';
import { COLORS } from '../constants/colors';
import { MapperHelpers } from './base.mapper';

/**
 * AutoMapper profile for Reportes service
 * Handles transformation of Gasto and Cuota entities into Chart.js compatible DTOs
 */
@Injectable()
export class ReportesMapperProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile(): MappingProfile {
    return (mapper) => {
      // Note: These mappers are demonstration of the pattern.
      // Actual transformation logic will be handled in the service methods
      // because AutoMapper's aggregation patterns work better with helper functions
    };
  }
}

/**
 * MapperHelper functions for Reportes transformations
 * Provides reusable logic for converting Gasto/Cuota entities to Chart.js DTOs
 */
export class ReportesMapperHelper {
  /**
   * Transform gastos array into GraficoTortaDto (Pie Chart)
   * Groups by category and sums amounts
   */
  static mapToGraficoTorta(gastos: Gasto[]): GraficoTortaDto {
    const categorias = MapperHelpers.aggregateByCategoria(gastos);
    const labels = categorias.map((c) => c.nombre);
    const data = categorias.map((c) => c.total);
    const colors = COLORS.slice(0, labels.length);

    return {
      labels,
      datasets: [
        {
          label: 'Gastos por Categoría',
          data,
          backgroundColor: colors,
          borderColor: colors.map((c) => MapperHelpers.darkenColor(c)),
          borderWidth: 2,
        },
      ],
      chartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right' as const,
          },
        },
      },
    };
  }

  /**
   * Transform gastos and cuotas into GraficoBarrasDto (Actual vs Future)
   * Groups by month and separates current spending from future installments
   */
  static mapToActualVsFuturo(gastos: Gasto[], cuotas: Cuota[], cantidadMeses: number, year: number): GraficoBarrasDto {
    const mesesMap = MapperHelpers.aggregateActualVsFuturo(gastos, cuotas, cantidadMeses, year);

    const labels = MapperHelpers.getMesesLabels(mesesMap);
    const dataActual = Array.from(mesesMap.values()).map((m) => m.actual);
    const dataFuturo = Array.from(mesesMap.values()).map((m) => m.futuro);

    return {
      labels,
      datasets: [
        {
          label: 'Gasto Actual',
          data: dataActual,
          backgroundColor: '#1976d2',
          borderColor: '#0d47a1',
          borderWidth: 1,
        },
        {
          label: 'Gasto Futuro (Cuotas)',
          data: dataFuturo,
          backgroundColor: '#ff9800',
          borderColor: '#e65100',
          borderWidth: 1,
        },
      ],
      chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * Transform gastos and cuotas into GraficoLineaDto (Evolution)
   * Shows total spending evolution over N months
   */
  static mapToEvolucionGastos(gastos: Gasto[], cuotas: Cuota[], mesesMap: Map<string, number>): GraficoLineaDto {
    const aggregatedMeses = MapperHelpers.aggregateEvolucionGastos(gastos, cuotas, mesesMap);
    const labels = MapperHelpers.getMesesLabels(aggregatedMeses);
    const data = Array.from(aggregatedMeses.values());
    const cantidadMeses = aggregatedMeses.size;

    return {
      labels,
      datasets: [
        {
          label: `Evolución de Gastos Totales (${cantidadMeses} meses)`,
          data,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          borderWidth: 2,
        },
      ],
      chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * Transform gastos into GraficoBarrasDto (By Tarjeta)
   * Groups by credit card and sums amounts
   */
  static mapToGastoPorTarjeta(gastos: Gasto[]): GraficoBarrasDto {
    const tarjetas = MapperHelpers.aggregateByTarjeta(gastos);
    const labels = tarjetas.map((t) => t.nombre);
    const data = tarjetas.map((t) => t.total);
    const baseColor = '#1976d2';

    return {
      labels,
      datasets: [
        {
          label: 'Gastos por Tarjeta',
          data,
          backgroundColor: baseColor,
          borderColor: '#0d47a1',
          borderWidth: 2,
        },
      ],
      chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }
}
