// gasto-dashboard-filtro.dto.ts
import { IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class GastoDashboardFiltroDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tarjetaId?: number;
}
