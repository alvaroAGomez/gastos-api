import { ApiProperty } from '@nestjs/swagger';

export class GastoMensualDto {
  @ApiProperty({ description: 'Mes en formato YYYY-MM' })
  mes: string;

  @ApiProperty({ description: 'Nombre del mes en español' })
  nombreMes: string;

  @ApiProperty({ description: 'Total de gastos en ese mes (cuotas + débitos incluidos)' })
  total: number;

  @ApiProperty({ description: 'Cantidad de cuotas en ese mes' })
  cantidadCuotas: number;

  @ApiProperty({ description: 'Desglose: Total de débitos en ese mes (ya incluido en total)' })
  totalDebitos: number;
}

export class Proyeccion12MesesResponseDto {
  @ApiProperty({ type: [GastoMensualDto] })
  gastosPorMes: GastoMensualDto[];

  @ApiProperty({ description: 'Total proyectado para los próximos 12 meses' })
  totalProyectado12Meses: number;

  @ApiProperty({ description: 'Promedio mensual' })
  promedioMensual: number;

  @ApiProperty({ description: 'Mes con mayor gasto' })
  mesConMayorGasto: {
    mes: string;
    nombreMes: string;
    total: number;
  };

  @ApiProperty({ description: 'Mes con menor gasto' })
  mesConMenorGasto: {
    mes: string;
    nombreMes: string;
    total: number;
  };
}
