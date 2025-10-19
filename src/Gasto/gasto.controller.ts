// src/modules/gastos/gastos.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { IsDateString, IsOptional } from 'class-validator';
import { GastosService } from './gasto.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/Auth/current-user.decorator';
import { Usuario } from 'src/Usuario/usuario.entity';
import { GastoDashboardDto } from './dto/gasto-dashboard.dto';
import { FiltroGastosDashboardDto } from './dto/gasto-dashboard-filtro.dto';
import { GastosCompletosResponseDto } from './dto/gasto-completo.dto';
import { FiltroGastosCompletosDto } from './dto/gasto-filtro-completo.dto';

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

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener últimos gastos para el dashboard' })
  @ApiResponse({ status: 200, type: [GastoDashboardDto] })
  getGastosDashboard(@Query() filtros: FiltroGastosDashboardDto, @CurrentUser() user: Usuario) {
    return this.gastos.getGastosDashboard(user.id, filtros);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los gastos del usuario con filtros y paginación' })
  @ApiResponse({ status: 200, type: GastosCompletosResponseDto })
  getGastosCompletos(@Query() filtros: FiltroGastosCompletosDto, @CurrentUser() user: Usuario) {
    return this.gastos.getGastosCompletos(user.id, filtros);
  }
}
