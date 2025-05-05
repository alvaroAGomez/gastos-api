import { Controller, Post, Get, Put, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TarjetaCreditoService } from './tarjeta-credito.service';
import { CreateTarjetaCreditoDto } from './dto/create-tarjeta-credito.dto';
import { UpdateTarjetaCreditoDto } from './dto/update-tarjeta-credito.dto';
import { TarjetaCreditoResponseDto } from './dto/tarjeta-credito-response.dto';
import { TarjetaCreditoDetalleDto } from './dto/tarjeta-credito-detalle.dto';
import { TarjetaCreditoResumenDto } from './dto/tarjeta-credito-resumen.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Usuario } from 'src/Usuario/usuario.entity';
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
  crearTarjeta(@Body() dto: CreateTarjetaCreditoDto, @CurrentUser() user: Usuario) {
    return this.service.crearTarjetaCredito(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tarjetas del usuario' })
  @ApiResponse({ status: 200, type: [TarjetaCreditoResponseDto] })
  obtenerTarjetas(@CurrentUser() user: Usuario) {
    return this.service.obtenerTarjetasDelUsuario(user.id);
  }

  @Get(':id/detalle')
  @ApiOperation({ summary: 'Detalle de cabecera de tarjeta de crédito' })
  @ApiResponse({ status: 200, type: TarjetaCreditoDetalleDto })
  obtenerDetalleTarjeta(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Usuario) {
    return this.service.obtenerDetalleTarjeta(id, user.id);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen de todas las tarjetas del usuario' })
  @ApiResponse({ status: 200, type: [TarjetaCreditoResumenDto] })
  obtenerResumen(@CurrentUser() user: Usuario) {
    return this.service.obtenerResumenTarjetasPorUsuario(user.id);
  }

  @Get(':id/movimientos')
  @ApiOperation({ summary: 'Movimientos recientes de la tarjeta de crédito' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos' })
  obtenerMovimientos(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Usuario) {
    return this.service.obtenerMovimientosTarjeta(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar tarjeta de crédito por ID' })
  @ApiResponse({ status: 200, type: TarjetaCreditoResponseDto })
  @ApiBody({ type: UpdateTarjetaCreditoDto })
  actualizarTarjeta(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: Usuario,
    @Body() dto: UpdateTarjetaCreditoDto
  ) {
    return this.service.actualizarTarjetaCredito(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar (baja lógica) una tarjeta de crédito' })
  @ApiResponse({ status: 200, description: 'Eliminado correctamente' })
  eliminarTarjeta(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Usuario) {
    return this.service.eliminarTarjetaCredito(id, user.id);
  }
}
