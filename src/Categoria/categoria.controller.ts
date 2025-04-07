import { Controller, Post, Body, UseGuards, Get, Patch, Param, Delete } from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { Usuario } from '../Usuario/user.entity';
import { CategoriaService } from './categoria.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@ApiTags('categoria')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('categoria')
export class CategoriaController {
  constructor(private readonly categoriesService: CategoriaService) {}

  @Post()
  async create(@Body() dto: CreateCategoriaDto, @CurrentUser() user: Usuario) {
    return this.categoriesService.create(dto, user);
  }

  @Get()
  async findAll(@CurrentUser() user: Usuario) {
    return this.categoriesService.findAllForUser(user);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateCategoriaDto, @CurrentUser() user: Usuario) {
    return this.categoriesService.update(id, dto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @CurrentUser() user: Usuario) {
    return this.categoriesService.remove(+id, user);
  }
}
