import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../Auth/current-user.decorator';
import { Usuario } from '../Usuario/usuario.entity';
import { CuotaResumenAnualResponseDto } from './dto/cuota-resumen-mensual.dto';
import { FiltroCuotasDto } from './dto/filtro-cuotas.dto';
import { CuotaResumenGeneralResponseDto } from './dto/cuota-resumen-general.dto';
import { CuotaResumenTarjetaDetalladoResponseDto } from './dto/cuota-resumen-tarjeta-detallado.dto';

@ApiTags('Cuota')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('Cuota')
export class CuotaController {
  constructor(private readonly cuotaService: CuotaService) {}

  // ============================================================================
  // 📊 RESÚMENES
  // ============================================================================

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen del mes actual por tarjeta' })
  async resumenActual(@CurrentUser() usuario: Usuario) {
    return this.cuotaService.resumenMensualActual(usuario);
  }

  @Get('resumen-anual')
  @ApiOperation({ summary: 'Resumen anual de cuotas por tarjeta' })
  @ApiQuery({ name: 'anio', required: false, type: Number })
  async getResumenAnual(
    @CurrentUser() usuario: Usuario,
    @Query('anio') anio?: number
  ): Promise<CuotaResumenAnualResponseDto> {
    return this.cuotaService.obtenerResumenAnual(usuario, anio);
  }

  @Get('resumen-general-anual')
  @ApiOperation({ summary: 'Resumen anual general de todas las tarjetas (sumado por mes)' })
  @ApiQuery({ name: 'anio', required: false, type: Number })
  async resumenGeneralAnual(
    @CurrentUser() usuario: Usuario,
    @Query('anio') anio?: number
  ): Promise<CuotaResumenGeneralResponseDto> {
    return this.cuotaService.obtenerResumenGeneralAnual(usuario, anio);
  }

  @Get('resumen-tarjeta/:tarjetaId')
  @ApiOperation({ summary: 'Resumen mensual detallado de una tarjeta específica' })
  @ApiQuery({ name: 'anio', required: false, type: Number })
  @ApiParam({ name: 'tarjetaId', type: Number })
  async resumenTarjeta(
    @CurrentUser() usuario: Usuario,
    @Param('tarjetaId') tarjetaId: number,
    @Query('anio') anio?: number
  ): Promise<CuotaResumenTarjetaDetalladoResponseDto> {
    return this.cuotaService.obtenerResumenMensualDetalladoTarjeta(usuario, tarjetaId, anio);
  }

  // ============================================================================
  // 🔎 CONSULTAS Y LISTADOS
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Listar cuotas del usuario logueado con filtros' })
  async listarCuotas(@CurrentUser() usuario: Usuario, @Query() filtros: FiltroCuotasDto) {
    return this.cuotaService.buscarCuotas(usuario, filtros);
  }

  @Get('gasto/:gastoId')
  @ApiOperation({ summary: 'Listar cuotas asociadas a un gasto específico' })
  @ApiParam({ name: 'gastoId', type: Number })
  async cuotasPorGasto(@Param('gastoId') gastoId: number) {
    return this.cuotaService.obtenerCuotasPorGasto(gastoId);
  }

  @Get('pendientes-futuras/:tarjetaId')
  @ApiOperation({ summary: 'Detalle de cuotas pendientes desde el mes siguiente por tarjeta' })
  @ApiParam({ name: 'tarjetaId', type: Number })
  async cuotasPendientesFuturas(@CurrentUser() usuario: Usuario, @Param('tarjetaId', ParseIntPipe) tarjetaId: number) {
    return this.cuotaService.obtenerCuotasPendientesFuturas(usuario, tarjetaId);
  }
}
