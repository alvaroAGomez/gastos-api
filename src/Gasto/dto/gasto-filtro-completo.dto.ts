import { IsOptional, IsNumber, IsDateString, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FiltroGastosCompletosDto {
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
    description: 'Mes en formato YYYY-MM',
    example: '2025-01',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  mes?: string; // formato: '2025-01', '2025-12', etc.

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

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    default: 1,
    minimum: 1,
    type: 'number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    type: 'number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    enum: ['fecha', 'monto', 'descripcion'],
    example: 'fecha',
    default: 'fecha',
  })
  @IsOptional()
  @IsString()
  @IsIn(['fecha', 'monto', 'descripcion'])
  orderBy?: 'fecha' | 'monto' | 'descripcion' = 'fecha';

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC' = 'DESC';
}
