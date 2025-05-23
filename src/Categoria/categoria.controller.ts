import { Controller, Post, Body, UseGuards, Get, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { CategoriaService } from './categoria.service';
import { Usuario } from '../Usuario/usuario.entity';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../Auth/current-user.decorator';

@ApiTags('Categorías de Gastos')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('CategoriaGasto')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una categoría de gasto' })
  async crear(@Body() dto: CreateCategoriaDto, @CurrentUser() user: Usuario) {
    return this.categoriaService.crearCategoria(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener categorías del usuario' })
  async obtenerCategoriasDelUsuario(@CurrentUser() user: Usuario) {
    return this.categoriaService.obtenerCategoriasDelUsuario(user);
  }

  @Get('all')
  @ApiOperation({ summary: 'Obtener categorías del usuario y globales' })
  async obtenerCategoriasGlobalesYDelUsuario(@CurrentUser() user: Usuario) {
    return this.categoriaService.obtenerCategoriasGlobalesYDelUsuario(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una categoría de gasto' })
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoriaDto,
    @CurrentUser() user: Usuario
  ) {
    return this.categoriaService.actualizarCategoria(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar (baja lógica) una categoría de gasto' })
  async eliminar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Usuario) {
    return this.categoriaService.eliminarCategoria(id, user);
  }
}
