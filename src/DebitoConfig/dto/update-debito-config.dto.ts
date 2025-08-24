import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Moneda } from 'src/Gasto/dto/create-gasto.dto';

export class UpdateDebitoConfigDto {
  @ApiPropertyOptional({ example: 5, description: 'ID de categoría del gasto' })
  @IsOptional()
  @IsNumber()
  categoriaId?: number;

  @ApiPropertyOptional({ example: 'Netflix', description: 'Descripción de la suscripción' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 1500.75, description: 'Nuevo monto mensual' })
  @IsOptional()
  @IsNumber()
  monto?: number;

  @ApiPropertyOptional({ example: 'ARS', enum: ['ARS', 'USD'], description: 'Nueva moneda' })
  @IsOptional()
  moneda?: Moneda;

  @ApiPropertyOptional({ example: true, description: 'Estado de la suscripción' })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
