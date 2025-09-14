import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gasto } from './gasto.entity';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { Usuario } from 'src/Usuario/usuario.entity';
import { Cuota } from 'src/Cuota/cuota.entity';
import { Categoria } from 'src/Categoria/categoria.entity';
import { DebitoConfig } from 'src/DebitoConfig/debito-config.entity';
import { EstadoCuenta } from 'src/EstadoCuenta/estado-cuenta.entity';
import { CuotaModule } from 'src/Cuota/cuota.module';
import { DebitoConfigModule } from 'src/DebitoConfig/debito-config.module';
import { EstadosModule } from 'src/EstadoCuenta/estado-cuenta.module';
import { GastoChartService } from './gasto-chart.service';
import { GastoMensualView } from './gasto-mensual.view';
import { GastosScheduler } from 'src/scheduler/gastos.scheduler';
import { GastosController } from './gasto.controller';
import { GastosService } from './gasto.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Gasto,
      TarjetaCredito,
      Usuario,
      Categoria,
      Cuota,
      GastoMensualView,
      DebitoConfig,
      EstadoCuenta,
    ]),
    CuotaModule,
    DebitoConfigModule,
    EstadosModule,
  ],
  controllers: [GastosController],
  providers: [GastosService, GastoChartService, GastosScheduler],
  exports: [GastosService],
})
export class GastoModule {}
