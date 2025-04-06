import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoryService } from './category.service';

import { UsersModule } from '../users/users.module';
import { CategoryController } from './categorys.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), UsersModule],
  providers: [CategoryService],
  controllers: [CategoryController],
})
export class categoryModule {}
