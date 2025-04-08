import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaService } from './categoria.service';

import { UsersModule } from '../Usuario/usuario.module';
import { CategoriaController } from './categoria.controller';
import { CategoriaGasto } from './categoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaGasto]), UsersModule],
  providers: [CategoriaService],
  controllers: [CategoriaController],
})
export class categoriaModule {}
