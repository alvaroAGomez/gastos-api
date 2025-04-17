import { ApiProperty } from '@nestjs/swagger';

export class CuotaItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  gastoId: number;

  @ApiProperty()
  numeroCuota: number;

  @ApiProperty()
  montoCuota: number;

  @ApiProperty()
  fechaVencimiento: Date;

  @ApiProperty()
  pagada: boolean;

  @ApiProperty()
  nombreTarjeta: string;
}

export class CuotaListaResponseDto {
  @ApiProperty({ type: [CuotaItemDto] })
  data: CuotaItemDto[];

  @ApiProperty()
  total: number;
}
