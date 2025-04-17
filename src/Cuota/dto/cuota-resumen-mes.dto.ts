import { ApiProperty } from '@nestjs/swagger';

export class CuotaResumenMesDto {
  @ApiProperty()
  tarjetaId: number;

  @ApiProperty()
  nombreTarjeta: string;

  @ApiProperty()
  totalMes: number;
}
