import { Module } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { CuotaController } from './cuota.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cuota } from './cuota.entity';
import { CuotasPendientesFuturasView } from './cuotas-pendientes-futuras.view';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota, CuotasPendientesFuturasView])],
  controllers: [CuotaController],
  providers: [CuotaService],
  exports: [CuotaService],
})
export class CuotaModule {}
