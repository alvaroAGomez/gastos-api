import { Module } from '@nestjs/common';
import { BancoService } from './banco.service';
import { BancoController } from './banco.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banco } from './banco.entity';
import { Usuario } from 'src/Usuario/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Banco, Usuario])],
  providers: [BancoService],
  controllers: [BancoController],
})
export class BancoModule {}
