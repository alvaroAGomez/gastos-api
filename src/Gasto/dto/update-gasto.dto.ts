import { PartialType } from '@nestjs/swagger';
import { CreateGastoDto } from './create-gasto.dto';
import { IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGastoDto extends PartialType(CreateGastoDto) {
  @ApiPropertyOptional({ example: 15, description: 'ID del gasto (solo para referencia interna)' })
  @IsOptional()
  @IsNumber()
  id?: number;
}
