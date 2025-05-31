import { PartialType } from '@nestjs/swagger';
import { CreateGastoDto } from './create-gasto.dto';
import { IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGastoDto extends PartialType(CreateGastoDto) {
  @ApiPropertyOptional({ example: 15, description: 'ID del gasto (solo para referencia interna)' })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({ example: '2025-05-01', description: 'Mes del primer pago (solo mes/año, formato yyyy-mm-01)' })
  @IsOptional()
  @IsDateString()
  mesPrimerPago?: string;
}
