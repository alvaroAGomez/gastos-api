import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateGastoDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de tarjeta de crédito (solo una tarjeta puede asociarse)' })
  @IsOptional()
  @IsNumber()
  tarjetaCreditoId?: number;

  @ApiPropertyOptional({ example: 2, description: 'ID de tarjeta de débito (solo una tarjeta puede asociarse)' })
  @IsOptional()
  @IsNumber()
  tarjetaDebitoId?: number;

  @ApiProperty({ example: 5, description: 'ID de categoría del gasto' })
  @IsNotEmpty()
  @IsNumber()
  categoriaGastoId: number;

  @ApiProperty({ example: 1500.75, description: 'Monto del gasto' })
  @IsNotEmpty()
  @IsNumber()
  monto: number;

  @ApiProperty({ example: '2025-04-14', description: 'Fecha del gasto (formato ISO: yyyy-mm-dd)' })
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({ example: 'Supermercado Día', description: 'Descripción opcional del gasto' })
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    example: true,
    description: 'Indica si el gasto es en cuotas (solo válido si se usa tarjeta de crédito)',
  })
  @IsNotEmpty()
  @IsBoolean()
  esEnCuotas: boolean;

  @ApiPropertyOptional({
    example: 3,
    description: 'Número de cuotas (solo para tarjeta de crédito). Si no se indica, se asume 1 por defecto.',
  })
  @IsOptional()
  @IsNumber()
  numeroCuotas?: number;
}
