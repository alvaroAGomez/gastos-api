import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export type Moneda = 'ARS' | 'USD';
export type TipoGasto = 'normal' | 'cuotas' | 'debito';

export class CreateGastoDto {
  @ApiProperty({ example: 1, description: 'ID del usuario que crea el gasto' })
  @IsNotEmpty()
  @IsNumber()
  usuarioId!: number;

  @ApiProperty({ example: 1, description: 'ID de la tarjeta' })
  @IsNotEmpty()
  @IsNumber()
  tarjetaId!: number;

  @ApiPropertyOptional({ example: 5, description: 'ID de categoría del gasto' })
  @IsOptional()
  @IsNumber()
  categoriaId?: number;

  @ApiPropertyOptional({ example: 'Compra en supermercado', description: 'Descripción del gasto' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 1500.75, description: 'Monto del gasto' })
  @IsNotEmpty()
  @IsNumber()
  monto!: number;

  @ApiProperty({ enum: ['ARS', 'USD'], description: 'Moneda del gasto' })
  @IsNotEmpty()
  moneda!: Moneda;

  @ApiProperty({ example: '2025-08-23', description: 'Fecha de la compra (formato: YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsString()
  fechaCompra!: string;

  @ApiProperty({ enum: ['normal', 'cuotas', 'debito'], description: 'Tipo de gasto' })
  @IsNotEmpty()
  tipo!: TipoGasto;

  @ApiPropertyOptional({ example: 3, description: 'Número de cuotas (solo si tipo="cuotas")' })
  @IsOptional()
  @IsNumber()
  cuotas?: number;
}
