import { IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FiltroGastosDashboardDto {
  @ApiPropertyOptional({
    description: 'Número de gastos a obtener',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
    type: 'number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'ID de la tarjeta de crédito',
    example: 1,
    type: 'number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tarjetaId?: number;

  @ApiPropertyOptional({
    description: 'ID de la categoría',
    example: 2,
    type: 'number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;

  @ApiPropertyOptional({
    description: 'Fecha desde (formato YYYY-MM-DD)',
    example: '2024-01-01',
    type: 'string',
  })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta (formato YYYY-MM-DD)',
    example: '2024-12-31',
    type: 'string',
  })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
