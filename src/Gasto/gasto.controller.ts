import { Controller, Post, Body, Get, Param, Delete, UseGuards, Put, Query, ParseIntPipe } from '@nestjs/common';
import { GastoService } from './gasto.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { GastoResponseDto } from './dto/gasto-response.dto';
import { JwtAuthGuard } from 'src/Auth/jwt-auth.guard';
import { CurrentUser } from 'src/Auth/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { Usuario } from 'src/Usuario/usuario.entity';
import { GastoTarjetaFiltroDto } from './dto/gasto-tarjeta-filtro.dto';
import { GastoDashboardDto } from './dto/gasto-dashboard.dto';
import { GastoMensualDto } from './dto/GastoMensualDto';
import { GastoDashboardFiltroDto } from './dto/gasto-dashboard-filtro.dto';

@ApiTags('Gastos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gastos')
export class GastoController {
  constructor(private readonly gastoService: GastoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo gasto' })
  create(@Body() dto: CreateGastoDto, @CurrentUser() user: Usuario): Promise<GastoResponseDto> {
    return this.gastoService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los gastos del usuario' })
  findAll(@CurrentUser() user: Usuario): Promise<GastoResponseDto[]> {
    return this.gastoService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un gasto específico por id' })
  findOne(@Param('id') id: string, @CurrentUser() user: Usuario): Promise<GastoResponseDto> {
    return this.gastoService.findOne(+id, user.id);
  }

  @Get('por-tarjeta/:tarjetaId')
  async gastosPorTarjeta(
    @Param('tarjetaId') tarjetaId: number,
    @Query() filtros: GastoTarjetaFiltroDto,
    @CurrentUser() user: Usuario
  ) {
    return this.gastoService.gastosPorTarjeta(tarjetaId, user.id, filtros);
  }

  @Post('charts/:chartType')
  async getChartData(@Param('chartType') chartType: string, @Body() filtros: any, @CurrentUser() user: Usuario) {
    return this.gastoService.getChartData(chartType, filtros, user.id);
  }

  @Get('charts/doughnut-category')
  async getDoughnutCategoryChart(@CurrentUser() user: Usuario) {
    return this.gastoService.getDoughnutCategoryData(user.id);
  }

  @Get('charts/bar-monthly-evolution')
  async getBarMonthlyEvolutionChart(@CurrentUser() user: Usuario) {
    return this.gastoService.getBarMonthlyEvolutionData(user.id);
  }

  @Get('charts/pie-card-distribution')
  async getPieCardDistributionChart(@CurrentUser() user: Usuario) {
    return this.gastoService.getPieCardDistributionData(user.id);
  }

  @Get('dashboard/tarjetas')
  async findAllDashboard(
    @CurrentUser() user: Usuario,
    @Query() filtro: GastoDashboardFiltroDto
  ): Promise<GastoDashboardDto[]> {
    return this.gastoService.findAllDashboard(user.id, filtro);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un gasto por id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGastoDto,
    @CurrentUser() user: Usuario
  ): Promise<GastoResponseDto> {
    return this.gastoService.update(+id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un gasto por id' })
  remove(@Param('id') id: string, @CurrentUser() user: Usuario): Promise<void> {
    return this.gastoService.remove(+id, user.id);
  }

  @Get('mensual/:tarjetaId')
  @ApiOperation({ summary: 'Gastos del mes actual por tarjeta' })
  @ApiParam({ name: 'tarjetaId', type: Number })
  @ApiResponse({ status: 200, type: [GastoMensualDto] })
  async gastosMensuales(
    @CurrentUser() usuario: Usuario,
    @Param('tarjetaId', ParseIntPipe) tarjetaId: number
  ): Promise<GastoMensualDto[]> {
    return this.gastoService.obtenerGastosMensualesPorTarjeta(usuario.id, tarjetaId);
  }
}
