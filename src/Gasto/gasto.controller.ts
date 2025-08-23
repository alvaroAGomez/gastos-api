// src/modules/gastos/gastos.controller.ts
import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, Min, ValidateIf } from 'class-validator';
import { GastosService, Moneda, TipoGasto, CrearGastoDto as _Crear } from './gasto.service';

class CrearGastoDto implements _Crear {
  @IsInt() usuarioId!: number;
  @IsInt() tarjetaId!: number;
  @IsOptional() @IsInt() categoriaId?: number;
  @IsOptional() descripcion?: string;
  @IsNumber() @IsPositive() monto!: number;
  @IsEnum(['ARS', 'USD'] as const) moneda!: Moneda;
  @IsDateString() fechaCompra!: string;
  @IsEnum(['normal', 'cuotas', 'debito'] as const) tipo!: TipoGasto;
  @ValidateIf((o) => o.tipo === 'cuotas') @IsInt() @Min(2) cuotas?: number;
}

class MaterializarDto {
  @IsOptional() @IsDateString() fecha?: string;
}

@Controller('gastos')
export class GastosController {
  constructor(private readonly gastos: GastosService) {}

  @Post()
  crear(@Body() dto: CrearGastoDto) {
    return this.gastos.crear(dto);
  }

  // opcional (lo usa el scheduler; sirve para backfill/testing)
  @Post('materializar-debito/:debitoConfigId')
  materializar(@Param('debitoConfigId', ParseIntPipe) id: number, @Body() b: MaterializarDto) {
    return this.gastos.crearDesdeDebitoConfig(id, b.fecha);
  }
}
