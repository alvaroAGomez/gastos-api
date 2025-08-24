import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { Moneda } from 'src/Gasto/dto/create-gasto.dto';

export class CreateDebitoConfigDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsNotEmpty()
  @IsNumber()
  usuarioId: number;

  @ApiProperty({ example: 1, description: 'ID de la tarjeta' })
  @IsNotEmpty()
  @IsNumber()
  tarjetaId: number;

  @ApiPropertyOptional({ example: 5, description: 'ID de categoría del gasto' })
  @IsOptional()
  @IsNumber()
  categoriaId?: number;

  @ApiPropertyOptional({ example: 'Netflix', description: 'Descripción de la suscripción' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 1500.75, description: 'Monto mensual de la suscripción' })
  @IsNotEmpty()
  @IsNumber()
  monto: number;

  @ApiProperty({ example: 'ARS', enum: ['ARS', 'USD'], description: 'Moneda del gasto' })
  @IsNotEmpty()
  moneda: Moneda;

  @ApiProperty({ example: '2025-08-24', description: 'Fecha de inicio de la suscripción' })
  @IsNotEmpty()
  fechaSuscripcion: Date;
}
