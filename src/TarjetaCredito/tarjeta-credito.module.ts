import { Module } from '@nestjs/common';
import { TarjetaCreditoController } from './tarjeta-credito.controller';
import { TarjetaCreditoService } from './tarjeta-credito.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarjetaCredito } from './tarjeta-credito.entity';
import { Banco } from 'src/Banco/banco.entity';
import { Usuario } from 'src/Usuario/usuario.entity';
import { Cuota } from 'src/Cuota/cuota.entity';
import { Gasto } from 'src/Gasto/gasto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TarjetaCredito, Banco, Usuario, Cuota, Gasto])],
  providers: [TarjetaCreditoService],
  controllers: [TarjetaCreditoController],
})
export class TarjetaCreditoModule {}
