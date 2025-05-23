import { Module } from '@nestjs/common';
import { TarjetaDebitoService } from './tarjeta-debito.service';
import { TarjetaDebitoController } from './tarjeta-debito.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarjetaDebito } from './tarjeta-debito.entity';
import { Banco } from '../Banco/banco.entity';
import { Usuario } from '../Usuario/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TarjetaDebito, Banco, Usuario])],
  providers: [TarjetaDebitoService],
  controllers: [TarjetaDebitoController],
})
export class TarjetaDebitoModule {}
