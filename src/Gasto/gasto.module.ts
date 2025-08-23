import { Module } from '@nestjs/common';

import { Gasto } from './gasto.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { Usuario } from 'src/Usuario/usuario.entity';
import { Cuota } from 'src/Cuota/cuota.entity';
import { CuotaModule } from 'src/Cuota/cuota.module';
import { GastoChartService } from './gasto-chart.service';
import { GastoMensualView } from './gasto-mensual.view';
import { GastosScheduler } from 'src/scheduler/gastos.scheduler';
import { Categoria } from 'src/Categoria/categoria.entity';
import { GastosController } from './gasto.controller';
import { GastosService } from './gasto.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Gasto, TarjetaCredito, , Usuario, Categoria, Cuota, GastoMensualView]),
    CuotaModule,
    ,
  ],
  controllers: [GastosController],
  providers: [GastosService, GastoChartService, GastosScheduler],
})
export class GastoModule {}
