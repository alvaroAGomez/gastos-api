import { ApiProperty } from '@nestjs/swagger';

export class CuotaPendienteDto {
  @ApiProperty({ description: 'ID del gasto' })
  gastoId: number;

  @ApiProperty({ description: 'Nombre/descripción del gasto' })
  nombreGasto: string;

  @ApiProperty({ description: 'Categoría del gasto' })
  categoria: {
    id: number;
    nombre: string;
    color_hex?: string;
    icono?: string;
  };

  @ApiProperty({ description: 'Monto total del gasto' })
  montoTotal: number;

  @ApiProperty({ description: 'Moneda del gasto' })
  moneda: string;

  @ApiProperty({ description: 'Cuota actual en la que va (ej: 3)' })
  cuotaActual: number;

  @ApiProperty({ description: 'Total de cuotas' })
  totalCuotas: number;

  @ApiProperty({ description: 'Cuotas que faltan pagar' })
  cuotasFaltantes: number;

  @ApiProperty({ description: 'Monto de cada cuota' })
  montoCuota: number;

  @ApiProperty({ description: 'Fecha de la próxima cuota' })
  proximaCuotaFecha: string;
}

export class CuotasPendientesResponseDto {
  @ApiProperty({ type: [CuotaPendienteDto] })
  cuotasPendientes: CuotaPendienteDto[];

  @ApiProperty({ description: 'Total de dinero en cuotas pendientes' })
  totalPendiente: number;

  @ApiProperty({ description: 'Cantidad de gastos con cuotas pendientes' })
  totalGastosConCuotasPendientes: number;
}
