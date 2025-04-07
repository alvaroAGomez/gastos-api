import { Module } from '@nestjs/common';
import { TarjetaDebitoService } from './tarjeta-debito.service';
import { TarjetaDebitoController } from './tarjeta-debito.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarjetaDebito } from 'src/TarjetaDebito/tarjeta-debito.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TarjetaDebito])],
  providers: [TarjetaDebitoService],
  controllers: [TarjetaDebitoController],
})
export class TarjetaDebitoModule {}
