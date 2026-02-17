import { IsOptional, IsNumber, IsString, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TipoGasto } from 'src/Gasto/enums/tipo-gasto.enum';

export class FiltroReportesDto {
  @ApiProperty({ description: 'ID de la tarjeta de crédito', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tarjetaId?: number;

  @ApiProperty({ description: 'Año (default: año actual)', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  año?: number;

  @ApiProperty({ description: 'Mes (1-12)', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  mes?: number;

  @ApiProperty({ description: 'ID de categoría para filtrar', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoriaId?: number;

  @ApiProperty({ description: 'Fecha desde (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @ApiProperty({ description: 'Fecha hasta (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  fechaHasta?: string;

  @ApiProperty({ description: 'Tipo de gasto: NORMAL (1), CUOTAS (2), DEBITO (3)', required: false, enum: TipoGasto })
  @IsOptional()
  @IsEnum(TipoGasto)
  @Type(() => Number)
  tipoGasto?: TipoGasto;

  @ApiProperty({ description: 'Cantidad de meses para evolución (default: 6, max: 12)', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  meses?: number;
}
