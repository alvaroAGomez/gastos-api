// src/modules/gastos/gastos.controller.ts
import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { IsDateString, IsOptional } from 'class-validator';
import { GastosService } from './gasto.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

class CreateGastoFromDebitoConfigDto {
  @IsOptional() @IsDateString() fecha?: string;
}
@ApiTags('Gastos')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('gastos')
export class GastosController {
  constructor(private readonly gastos: GastosService) {}

  @Post()
  createGasto(@Body() dto: CreateGastoDto) {
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
