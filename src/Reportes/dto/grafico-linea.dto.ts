import { ApiProperty } from '@nestjs/swagger';

export class DatasetLinea {
  @ApiProperty({ description: 'Etiqueta del dataset (ej: Cuotas, Débitos)' })
  label: string;

  @ApiProperty({ description: 'Datos del gráfico (montos)' })
  data: number[];

  @ApiProperty({ description: 'Color de la línea' })
  borderColor: string;

  @ApiProperty({ description: 'Color de fondo (para área bajo la línea)' })
  backgroundColor: string;

  @ApiProperty({ description: 'Si la línea rellena el área debajo', required: false })
  fill?: boolean;

  @ApiProperty({ description: 'Ancho de la línea', required: false })
  borderWidth?: number;

  @ApiProperty({ description: 'Puntos visibles en la línea', required: false })
  pointRadius?: number;

  @ApiProperty({ description: 'Tensión de la línea (curvatura)', required: false })
  tension?: number;
}

export class GraficoLineaDto {
  @ApiProperty({ description: 'Etiquetas del eje X (meses)' })
  labels: string[];

  @ApiProperty({ description: 'Datasets con datos del gráfico', type: [DatasetLinea] })
  datasets: DatasetLinea[];

  @ApiProperty({ description: 'Opciones del gráfico en Chart.js', required: false })
  chartOptions?: any;
}
