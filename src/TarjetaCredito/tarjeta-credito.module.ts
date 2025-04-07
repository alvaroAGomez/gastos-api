import { Module } from '@nestjs/common';
import { TarjetaCreditoController } from './tarjeta-credito.controller';
import { TarjetaCreditoService } from './tarjeta-credito.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarjetaCredito } from './tarjeta-credito.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TarjetaCredito])],
  providers: [TarjetaCreditoService],
  controllers: [TarjetaCreditoController],
})
export class TarjetaCreditoModule {}
