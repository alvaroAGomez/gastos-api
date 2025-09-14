import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarjetaCreditoController } from './tarjeta-credito.controller';
import { TarjetaCreditoService } from './tarjeta-credito.service';
import { TarjetaCredito } from './tarjeta-credito.entity';
import { Banco } from '../Banco/banco.entity';
import { Usuario } from '../Usuario/usuario.entity';
import { Cuota } from '../Cuota/cuota.entity';
import { Gasto } from '../Gasto/gasto.entity';
import { EstadosModule } from '../EstadoCuenta/estado-cuenta.module';

@Module({
  imports: [TypeOrmModule.forFeature([TarjetaCredito, Banco, Usuario, Cuota, Gasto]), EstadosModule],
  providers: [TarjetaCreditoService],
  controllers: [TarjetaCreditoController],
  exports: [TarjetaCreditoService],
})
export class TarjetaCreditoModule {}
