import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuotaService } from './cuota.service';
import { CuotaController } from './cuota.controller';
import { Cuota } from './cuota.entity';
import { CuotasPendientesFuturasView } from './cuotas-pendientes-futuras.view';
import { EstadoCuenta } from '../EstadoCuenta/estado-cuenta.entity';
import { TarjetaCredito } from '../TarjetaCredito/tarjeta-credito.entity';
import { EstadoCuentaService } from '../EstadoCuenta/estado-cuenta.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota, CuotasPendientesFuturasView, EstadoCuenta, TarjetaCredito])],
  controllers: [CuotaController],
  providers: [CuotaService, EstadoCuentaService],
  exports: [CuotaService],
})
export class CuotaModule {}
