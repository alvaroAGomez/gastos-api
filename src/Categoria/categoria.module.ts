import { Categoria } from 'src/Categoria/categoria.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaService } from './categoria.service';

import { UsersModule } from '../Usuario/usuario.module';
import { CategoriaController } from './categoria.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria]), UsersModule],
  providers: [CategoriaService],
  controllers: [CategoriaController],
})
export class CategoriaModule {}
