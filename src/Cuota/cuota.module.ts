import { Module } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { CuotaController } from './cuota.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cuota } from './cuota.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota])],
  controllers: [CuotaController],
  providers: [CuotaService],
})
export class CuotaModule {}
