import { Module } from '@nestjs/common';
import { TarjetaDebitoService } from './tarjeta-debito.service';
import { TarjetaDebitoController } from './tarjeta-debito.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarjetaDebito } from 'src/TarjetaDebito/tarjeta-debito.entity';
import { Banco } from 'src/Banco/banco.entity';
import { Usuario } from 'src/Usuario/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TarjetaDebito, Banco, Usuario])],
  providers: [TarjetaDebitoService],
  controllers: [TarjetaDebitoController],
})
export class TarjetaDebitoModule {}
