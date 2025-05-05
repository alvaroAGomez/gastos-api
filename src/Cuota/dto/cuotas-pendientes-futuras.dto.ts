import { ApiProperty } from '@nestjs/swagger';

export class CuotaPendienteDetalleDto {
  @ApiProperty({ example: 7 })
  gastoId: number;

  @ApiProperty({ example: 'Pasaje a Mendoza' })
  descripcion: string;

  @ApiProperty({ example: '2025-03-12' })
  fechaGasto: Date;

  @ApiProperty({ example: 2500 })
  montoCuota: number;

  @ApiProperty({ example: 3 })
  cuotasPendientes: number;

  @ApiProperty({ example: 7500 })
  totalFaltante: number;
}

export class CuotasPendientesFuturasResponseDto {
  @ApiProperty({ type: [CuotaPendienteDetalleDto] })
  detalles: CuotaPendienteDetalleDto[];

  @ApiProperty({ example: 97500 })
  totalGeneral: number;
}
