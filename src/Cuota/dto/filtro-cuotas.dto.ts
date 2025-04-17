import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FiltroCuotasDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  tarjetaId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  mes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  anio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  pagada?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
