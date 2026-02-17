import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { FiltroReportesDto } from './dto/filtro-reportes.dto';
import { GraficoTortaDto } from './dto/grafico-torta.dto';
import { GraficoBarrasDto } from './dto/grafico-barras.dto';
import { GraficoLineaDto } from './dto/grafico-linea.dto';
import { CurrentUser } from '../Auth/current-user.decorator';
import { Usuario } from '../Usuario/usuario.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ApiResponseBuilder } from 'src/common/response/api-response.builder';
import { TipoGasto } from 'src/Gasto/enums/tipo-gasto.enum';

@ApiTags('Reportes y Gráficos')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('gasto-por-categoria')
  @ApiOperation({ summary: 'Obtener gráfico de torta con gastos por categoría' })
  @ApiQuery({ name: 'tarjetaId', type: Number, required: true })
  @ApiQuery({ name: 'año', type: Number, required: false })
  @ApiQuery({ name: 'mes', type: Number, required: false, description: 'Mes (1-12)' })
  @ApiQuery({ name: 'categoriaId', type: Number, required: false })
  @ApiQuery({
    name: 'tipoGasto',
    type: Number,
    required: false,
    description: 'TipoGasto enum: NORMAL (1), CUOTAS (2), DEBITO (3)',
    enum: TipoGasto,
  })
  @ApiResponse({ status: 200, type: GraficoTortaDto })
  async getGastoPorCategoria(@Query() filtros: FiltroReportesDto, @CurrentUser() user: Usuario) {
    const grafico = await this.reportesService.obtenerGastoPorCategoria(user.id, filtros.tarjetaId, filtros);
    return ApiResponseBuilder.success(grafico, 'Gráfico de gastos por categoría obtenido exitosamente');
  }

  @Get('actual-vs-futuro')
  @ApiOperation({ summary: 'Obtener gráfico de barras con gasto actual vs futuro (mensual)' })
  @ApiQuery({ name: 'tarjetaId', type: Number, required: true })
  @ApiQuery({ name: 'meses', type: Number, required: false, description: 'Default: 6, Max: 12' })
  @ApiQuery({ name: 'año', type: Number, required: false })
  @ApiResponse({ status: 200, type: GraficoBarrasDto })
  async getActualVsFuturo(
    @Query('tarjetaId', ParseIntPipe) tarjetaId: number,
    @Query('meses') meses: number = 6,
    @Query('año') año?: number,
    @CurrentUser() user?: Usuario
  ) {
    const grafico = await this.reportesService.obtenerActualVsFuturo(user.id, tarjetaId, meses, año);
    return ApiResponseBuilder.success(grafico, 'Gráfico actual vs futuro obtenido exitosamente');
  }

  @Get('evolucion-gastos')
  @ApiOperation({ summary: 'Obtener gráfico de línea con evolución total de gastos (últimos N meses)' })
  @ApiQuery({ name: 'tarjetaId', type: Number, required: false })
  @ApiQuery({ name: 'meses', type: Number, required: false, description: 'Default: 6, Max: 12' })
  @ApiResponse({ status: 200, type: GraficoLineaDto })
  async getEvolucionGastos(
    @Query('tarjetaId') tarjetaId?: number,
    @Query('meses') meses: number = 6,
    @CurrentUser() user?: Usuario
  ) {
    const grafico = await this.reportesService.obtenerEvolucionGastos(user.id, tarjetaId, meses);
    return ApiResponseBuilder.success(grafico, 'Gráfico de evolución de gastos obtenido exitosamente');
  }

  @Get('gasto-por-tarjeta')
  @ApiOperation({ summary: 'Obtener gráfico de barras con gastos por tarjeta' })
  @ApiQuery({ name: 'año', type: Number, required: false })
  @ApiQuery({ name: 'mes', type: Number, required: false, description: 'Mes (1-12)' })
  @ApiResponse({ status: 200, type: GraficoBarrasDto })
  async getGastoPorTarjeta(@Query('año') año?: number, @Query('mes') mes?: number, @CurrentUser() user?: Usuario) {
    const grafico = await this.reportesService.obtenerGastoPorTarjeta(user.id, año, mes);
    return ApiResponseBuilder.success(grafico, 'Gráfico de gastos por tarjeta obtenido exitosamente');
  }
}
