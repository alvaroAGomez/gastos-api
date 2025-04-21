export class GastoChartsFiltroDto {
  fechaDesde?: string;
  fechaHasta?: string;
  categoria?: string | number;
  tarjeta?: string | number;
  agrupacion?: 'mes' | 'categoria' | 'anio';
  anio?: number;
}
