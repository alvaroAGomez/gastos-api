import { Controller, Post, Body, UseGuards, Get, Patch, Param, Delete } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { CategoryService } from './category.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoriesService: CategoryService) {}

  @Post()
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: User) {
    return this.categoriesService.create(dto, user);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.categoriesService.findAllForUser(user);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateCategoryDto, @CurrentUser() user: User) {
    return this.categoriesService.update(id, dto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @CurrentUser() user: User) {
    return this.categoriesService.remove(+id, user);
  }
}
