import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GastoTarjetaFiltroDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fechaHasta?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  cuotasRestantes?: number; // será number o undefined

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiProperty({ required: false, enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC';
}
