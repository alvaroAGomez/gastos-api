import { Module } from '@nestjs/common';
import { GastoController } from './gasto.controller';

import { GastoService } from './gasto.service';
import { Gasto } from './gasto.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Gasto])],
  controllers: [GastoController],
  providers: [GastoService],
})
export class GastoModule {}
