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

class CreateGastoFromDebitoConfigDto {
  @IsOptional() @IsDateString() fecha?: string;
}

@Controller('gastos')
export class GastosController {
  constructor(private readonly gastos: GastosService) {}

  @Post()
  createGasto(@Body() dto: CrearGastoDto) {
    return this.gastos.createGasto(dto);
  }

  @Post('materializar-debito/:debitoConfigId')
  createGastoFromDebitoConfig(
    @Param('debitoConfigId', ParseIntPipe) id: number,
    @Body() dto: CreateGastoFromDebitoConfigDto
  ) {
    return this.gastos.createGastoFromDebitoConfig(id, dto.fecha);
  }
}
