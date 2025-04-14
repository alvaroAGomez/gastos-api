import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GastoResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  monto: number;

  @ApiProperty()
  fecha: Date;

  @ApiPropertyOptional()
  descripcion?: string;

  @ApiProperty()
  esEnCuotas: boolean;

  @ApiPropertyOptional()
  numeroCuotas?: number;

  @ApiProperty()
  nombreCategoria: string;
}
