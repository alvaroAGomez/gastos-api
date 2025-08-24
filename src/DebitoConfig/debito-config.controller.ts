import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../Auth/jwt-auth.guard';
import { CurrentUser } from '../Auth/current-user.decorator';
import { Usuario } from '../Usuario/usuario.entity';
import { DebitoConfigService } from './debito-config.service';
import { UpdateDebitoConfigDto } from './dto/update-debito-config.dto';

@ApiTags('Débitos Automáticos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('debitos-automaticos')
export class DebitoConfigController {
  constructor(private readonly service: DebitoConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las suscripciones activas del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de suscripciones activas' })
  async getSuscripcionesActivas(@CurrentUser() user: Usuario) {
    return this.service.getSuscripcionesActivas(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una suscripción' })
  @ApiResponse({ status: 200, description: 'Detalle de la suscripción' })
  async getById(@Param('id') id: number, @CurrentUser() user: Usuario) {
    return this.service.getSuscripcionById(id, user.id);
  }

  @Put(':id/desactivar')
  @ApiOperation({ summary: 'Desactivar una suscripción' })
  @ApiResponse({ status: 200, description: 'Suscripción desactivada correctamente' })
  async updateEstadoSuscripcion(@Param('id') id: number, @CurrentUser() user: Usuario) {
    return this.service.updateEstadoSuscripcion(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar configuración de débito' })
  @ApiResponse({ status: 200, description: 'Suscripción actualizada correctamente' })
  async updateSuscripcion(@Param('id') id: number, @Body() dto: UpdateDebitoConfigDto, @CurrentUser() user: Usuario) {
    return this.service.updateSuscripcion(id, dto, user.id);
  }
}
