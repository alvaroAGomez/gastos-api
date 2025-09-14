import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadosScheduler } from 'src/scheduler/estados.scheduler';
import { EstadoCuenta } from './estado-cuenta.entity';
import { EstadoCuentaService } from './estado-cuenta.service';
import { TarjetaCredito } from '../TarjetaCredito/tarjeta-credito.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EstadoCuenta, TarjetaCredito])],
  providers: [EstadosScheduler, EstadoCuentaService],
  exports: [EstadoCuentaService],
})
export class EstadosModule {}
