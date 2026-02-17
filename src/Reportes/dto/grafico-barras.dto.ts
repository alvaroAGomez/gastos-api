import { ApiProperty } from '@nestjs/swagger';

export class DatasetBarras {
  @ApiProperty({ description: 'Etiqueta del dataset (ej: nombre tarjeta, tipo de gasto)' })
  label: string;

  @ApiProperty({ description: 'Datos del gráfico (montos)' })
  data: number[];

  @ApiProperty({ description: 'Color de fondo (puede ser string o string[] para múltiples colores)' })
  backgroundColor: string | string[];

  @ApiProperty({ description: 'Color del borde (puede ser string o string[] para múltiples colores)' })
  borderColor: string | string[];

  @ApiProperty({ description: 'Ancho del borde', required: false })
  borderWidth?: number;
}

export class GraficoBarrasDto {
  @ApiProperty({ description: 'Etiquetas del eje X' })
  labels: string[];

  @ApiProperty({ description: 'Datasets con datos del gráfico', type: [DatasetBarras] })
  datasets: DatasetBarras[];

  @ApiProperty({ description: 'Opciones del gráfico en Chart.js', required: false })
  chartOptions?: any;
}
