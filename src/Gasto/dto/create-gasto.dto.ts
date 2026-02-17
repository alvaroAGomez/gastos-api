import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { TipoGasto } from '../enums/tipo-gasto.enum';

export type Moneda = 'ARS' | 'USD';

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

  @ApiProperty({ enum: TipoGasto, example: 1, description: 'Tipo de gasto: 1=Normal, 2=Cuotas, 3=Débito' })
  @IsNotEmpty()
  @IsEnum(TipoGasto)
  tipo!: TipoGasto;

  @ApiPropertyOptional({ example: 3, description: 'Número de cuotas (solo si tipo=2 Cuotas)' })
  @IsOptional()
  @IsNumber()
  cuotas?: number;
}
