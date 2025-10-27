import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/Auth/current-user.decorator';
import { Usuario } from 'src/Usuario/usuario.entity';
import { ResumenFinancieroDto } from './dto/resumen-financiero.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen-financiero')
  @ApiOperation({ summary: 'Obtener resumen financiero: total disponible, gastos del mes y próximo cierre' })
  @ApiResponse({ status: 200, type: ResumenFinancieroDto })
  async getResumenFinanciero(@CurrentUser() user: Usuario) {
    return await this.dashboardService.getResumenFinanciero(user.id);
  }
}
