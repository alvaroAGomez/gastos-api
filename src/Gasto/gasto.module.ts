import { Module } from '@nestjs/common';
import { GastoController } from './gasto.controller';

import { GastoService } from './gasto.service';
import { Gasto } from './gasto.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaGasto } from 'src/Categoria/categoria.entity';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { TarjetaDebito } from 'src/TarjetaDebito/tarjeta-debito.entity';
import { Usuario } from 'src/Usuario/usuario.entity';
import { Cuota } from 'src/Cuota/cuota.entity';
import { CuotaModule } from 'src/Cuota/cuota.module';
import { GastoChartService } from './gasto-chart.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Gasto, TarjetaCredito, TarjetaDebito, Usuario, CategoriaGasto, Cuota]),
    CuotaModule,
  ],
  controllers: [GastoController],
  providers: [GastoService, GastoChartService],
})
export class GastoModule {}
