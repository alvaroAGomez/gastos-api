import { Module } from '@nestjs/common';
import { BancoService } from './banco.service';
import { BancoController } from './banco.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banco } from './banco.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Banco])],
  providers: [BancoService],
  controllers: [BancoController],
})
export class BancoModule {}
