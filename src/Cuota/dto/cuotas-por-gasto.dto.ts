import { ApiProperty } from '@nestjs/swagger';

export class CuotaPorGastoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  numeroCuota: number;

  @ApiProperty()
  montoCuota: number;

  @ApiProperty()
  fechaVencimiento: Date;

  @ApiProperty()
  pagada: boolean;
}
