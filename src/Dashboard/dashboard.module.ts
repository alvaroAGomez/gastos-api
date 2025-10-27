import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { Cuota } from 'src/Cuota/cuota.entity';
import { DebitoConfig } from 'src/DebitoConfig/debito-config.entity';
import { EstadoCuenta } from 'src/EstadoCuenta/estado-cuenta.entity';
import { TarjetaCreditoModule } from 'src/TarjetaCredito/tarjeta-credito.module';

@Module({
  imports: [TypeOrmModule.forFeature([TarjetaCredito, Cuota, DebitoConfig, EstadoCuenta]), TarjetaCreditoModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
