import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadosScheduler } from 'src/scheduler/estados.scheduler';
import { EstadoCuenta } from './estado-cuenta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EstadoCuenta])],
  providers: [EstadosScheduler],
})
export class EstadosModule {}
