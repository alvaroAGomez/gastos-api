import { Module } from '@nestjs/common';
import { TarjetaCreditoController } from './tarjeta-credito.controller';
import { TarjetaCreditoService } from './tarjeta-credito.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarjetaCredito } from './tarjeta-credito.entity';
import { Banco } from '../Banco/banco.entity';
import { Usuario } from '../Usuario/usuario.entity';
import { Cuota } from '../Cuota/cuota.entity';
import { Gasto } from '../Gasto/gasto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TarjetaCredito, Banco, Usuario, Cuota, Gasto])],
  providers: [TarjetaCreditoService],
  controllers: [TarjetaCreditoController],
})
export class TarjetaCreditoModule {}
