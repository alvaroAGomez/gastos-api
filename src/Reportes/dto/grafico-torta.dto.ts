import { ApiProperty } from '@nestjs/swagger';

export class DatasetTorta {
  @ApiProperty({ description: 'Etiqueta del dataset' })
  label: string;

  @ApiProperty({ description: 'Datos del gráfico (montos)' })
  data: number[];

  @ApiProperty({ description: 'Colores de fondo para cada segmento' })
  backgroundColor: string[];

  @ApiProperty({ description: 'Colores del borde para cada segmento' })
  borderColor: string[];

  @ApiProperty({ description: 'Ancho del borde', required: false })
  borderWidth?: number;
}

export class GraficoTortaDto {
  @ApiProperty({ description: 'Etiquetas (nombres de categorías)' })
  labels: string[];

  @ApiProperty({ description: 'Datasets con datos del gráfico', type: [DatasetTorta] })
  datasets: DatasetTorta[];

  @ApiProperty({ description: 'Opciones del gráfico en Chart.js', required: false })
  chartOptions?: any;
}
