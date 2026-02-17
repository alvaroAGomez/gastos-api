import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Gasto } from 'src/Gasto/gasto.entity';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { Categoria } from 'src/Categoria/categoria.entity';
import { Cuota } from 'src/Cuota/cuota.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Gasto, TarjetaCredito, Categoria, Cuota])],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
