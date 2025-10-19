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

  @ApiProperty()
  esSuscripcion: boolean;

  @ApiPropertyOptional()
  numeroCuotas?: number;

  @ApiProperty()
  categoria: string;

  @ApiPropertyOptional()
  cuotas?: number;

  @ApiPropertyOptional()
  cuotasRestantes?: number;

  @ApiPropertyOptional()
  cardId?: string;

  @ApiPropertyOptional()
  nameCard?: string;

  @ApiPropertyOptional()
  mesPrimerPago?: string;

  @ApiPropertyOptional()
  gastoRecurrenteId?: number;

  @ApiPropertyOptional()
  frecuencia?: string;
}
