import { Controller, Post, Get, Put, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TarjetaCreditoService } from './tarjeta-credito.service';
import { CreateTarjetaCreditoDto } from './dto/create-tarjeta-credito.dto';
import { UpdateTarjetaCreditoDto } from './dto/update-tarjeta-credito.dto';
import { TarjetaCreditoResponseDto } from './dto/tarjeta-credito-response.dto';
import { TarjetaCreditoDetalleDashboardDto } from './dto/tarjeta-credito-detalle-dashboard.dto';
import { CuotasPendientesResponseDto } from './dto/cuota-pendiente.dto';
import { Proyeccion12MesesResponseDto } from './dto/proyeccion-12-meses.dto';
import { CurrentUser } from '../Auth/current-user.decorator';
import { Usuario } from '../Usuario/usuario.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Tarjeta Crédito')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('tarjetas-credito')
export class TarjetaCreditoController {
  constructor(private readonly service: TarjetaCreditoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una tarjeta de crédito' })
  @ApiResponse({ status: 201, type: TarjetaCreditoResponseDto })
  createTarjetaCredito(@Body() createTarjetaCreditoDto: CreateTarjetaCreditoDto, @CurrentUser() user: Usuario) {
    return this.service.createTarjetaCredito(createTarjetaCreditoDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tarjetas del usuario' })
  @ApiResponse({ status: 200, type: [TarjetaCreditoResponseDto] })
  obtenerTarjetasCredito(@CurrentUser() user: Usuario) {
    return this.service.obtenerTarjetasCredito(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarjeta de crédito por ID' })
  @ApiResponse({ status: 200, type: TarjetaCreditoResponseDto })
  getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Usuario) {
    return this.service.getById(id, user.id);
  }

  @Get(':id/detalle-dashboard')
  @ApiOperation({ summary: 'Obtener resumen detallado de una tarjeta para dashboard y detalle' })
  @ApiResponse({ status: 200, type: TarjetaCreditoDetalleDashboardDto })
  async getDetalleDashboard(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Usuario
  ): Promise<TarjetaCreditoDetalleDashboardDto> {
    return await this.service.calcularResumenTarjetaDetallado(id, user.id);
  }

  @Get(':id/cuotas-pendientes')
  @ApiOperation({ summary: 'Obtener listado de cuotas pendientes de una tarjeta' })
  @ApiResponse({ status: 200, type: CuotasPendientesResponseDto })
  async getCuotasPendientes(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Usuario
  ): Promise<CuotasPendientesResponseDto> {
    return await this.service.obtenerCuotasPendientes(id, user.id);
  }

  @Get(':id/proyeccion-12-meses')
  @ApiOperation({ summary: 'Obtener proyección de gastos para los próximos 12 meses' })
  @ApiResponse({ status: 200, type: Proyeccion12MesesResponseDto })
  async getProyeccion12Meses(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Usuario
  ): Promise<Proyeccion12MesesResponseDto> {
    return await this.service.obtenerProyeccion12Meses(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una tarjeta de crédito' })
  @ApiResponse({ status: 200, type: TarjetaCreditoResponseDto })
  @ApiBody({ type: UpdateTarjetaCreditoDto })
  updateTarjetaCredito(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTarjetaCreditoDto: UpdateTarjetaCreditoDto,
    @CurrentUser() user: Usuario
  ) {
    return this.service.updateTarjetaCredito(id, updateTarjetaCreditoDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una tarjeta de crédito' })
  @ApiResponse({ status: 200 })
  deleteTarjetaCredito(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Usuario) {
    return this.service.deleteTarjetaCredito(id, user.id);
  }
}
