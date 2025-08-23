import { Controller, Post, Body, UseGuards, Get, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { CategoriaService } from './categoria.service';
import { Usuario } from '../Usuario/usuario.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../Auth/current-user.decorator';

@ApiTags('Categorías')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('categoria')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva categoría' })
  async createCategoria(@Body() createCategoriaDto: CreateCategoriaDto, @CurrentUser() user: Usuario) {
    return this.categoriaService.createCategoria(createCategoriaDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las categorías (globales y del usuario)' })
  async getCategorias(@CurrentUser() user: Usuario) {
    return this.categoriaService.getCategorias(user);
  }

  @Get('usuario')
  @ApiOperation({ summary: 'Obtener solo las categorías del usuario' })
  async getCategoriasUsuario(@CurrentUser() user: Usuario) {
    return this.categoriaService.getCategoriasUsuario(user);
  }

  @Get('globales')
  @ApiOperation({ summary: 'Obtener solo las categorías globales' })
  async getCategoriasGlobales() {
    return this.categoriaService.getCategoriasGlobales();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría específica por ID' })
  async getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Usuario) {
    return this.categoriaService.getById(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una categoría' })
  async updateCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoriaDto: UpdateCategoriaDto,
    @CurrentUser() user: Usuario
  ) {
    return this.categoriaService.updateCategoria(id, updateCategoriaDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una categoría' })
  async deleteCategoria(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Usuario) {
    return this.categoriaService.deleteCategoria(id, user);
  }
}
