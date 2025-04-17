import { ApiProperty } from '@nestjs/swagger';

export class ResumenMensualDto {
  @ApiProperty()
  mes: string;

  @ApiProperty()
  totalCuotas: number;
}

export class CuotaResumenTarjetaDto {
  @ApiProperty()
  tarjetaId: number;

  @ApiProperty()
  nombreTarjeta: string;

  @ApiProperty()
  anio: number;

  @ApiProperty({ type: [ResumenMensualDto] })
  resumenMensual: ResumenMensualDto[];

  @ApiProperty()
  totalAnual: number;
}

export class CuotaResumenAnualResponseDto {
  @ApiProperty({ type: [CuotaResumenTarjetaDto] })
  resumenPorTarjeta: CuotaResumenTarjetaDto[];

  @ApiProperty()
  totalGeneral: number;
}
