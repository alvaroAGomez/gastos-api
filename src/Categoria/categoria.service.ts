import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { CategoriaResponseDto } from './dto/categoria-response.dto';
import { Usuario } from 'src/Usuario/usuario.entity';
import { ApiResponse, ApiResponseBuilder } from '../common/response/api-response.builder';
import { Categoria } from './categoria.entity';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>
  ) {}

  async createCategoria(
    createCategoriaDto: CreateCategoriaDto,
    usuario: Usuario
  ): Promise<ApiResponse<CategoriaResponseDto>> {
    try {
      // Validar que no exista otra categoría con el mismo nombre (insensible a mayúsculas/minúsculas)
      const existente = await this.categoriaRepository
        .createQueryBuilder('categoria')
        .where('LOWER(TRIM(categoria.nombre)) = LOWER(TRIM(:nombre))', {
          nombre: createCategoriaDto.nombre,
        })
        .andWhere('(categoria.usuario_id = :usuarioId OR categoria.es_global = true)', {
          usuarioId: usuario.id,
        })
        .getOne();

      if (existente) {
        return ApiResponseBuilder.error(400, 'Ya existe una categoría con ese nombre');
      }

      const categoria = this.categoriaRepository.create({
        ...createCategoriaDto,
        nombre: createCategoriaDto.nombre.trim(),
        usuario: createCategoriaDto.es_global ? null : usuario,
      });

      const saved = await this.categoriaRepository.save(categoria);
      const response: CategoriaResponseDto = {
        id: saved.id,
        nombre: saved.nombre,
        usuarioId: saved.usuario?.id || null,
      };

      return ApiResponseBuilder.success(response, 'Categoría creada exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al crear la categoría');
    }
  }

  async getCategorias(usuario: Usuario): Promise<ApiResponse<CategoriaResponseDto[]>> {
    try {
      const categorias = await this.categoriaRepository
        .createQueryBuilder('categoria')
        .leftJoinAndSelect('categoria.usuario', 'usuario')
        .where('usuario.id = :usuarioId OR categoria.es_global = true', {
          usuarioId: usuario.id,
        })
        .getMany();

      const response = categorias.map((cat) => ({
        id: cat.id,
        nombre: cat.nombre,
        usuarioId: cat.usuario?.id || null,
      }));

      return ApiResponseBuilder.success(response, 'Categorías obtenidas exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al obtener las categorías');
    }
  }

  async getCategoriasUsuario(usuario: Usuario): Promise<ApiResponse<CategoriaResponseDto[]>> {
    try {
      const categorias = await this.categoriaRepository
        .createQueryBuilder('categoria')
        .leftJoinAndSelect('categoria.usuario', 'usuario')
        .where('usuario.id = :usuarioId', { usuarioId: usuario.id })
        .getMany();

      const response = categorias.map((cat) => ({
        id: cat.id,
        nombre: cat.nombre,
        usuarioId: cat.usuario.id,
      }));

      return ApiResponseBuilder.success(response, 'Categorías del usuario obtenidas exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al obtener las categorías del usuario');
    }
  }

  async getCategoriasGlobales(): Promise<ApiResponse<CategoriaResponseDto[]>> {
    try {
      const categorias = await this.categoriaRepository
        .createQueryBuilder('categoria')
        .where('categoria.es_global = true')
        .getMany();

      const response = categorias.map((cat) => ({
        id: cat.id,
        nombre: cat.nombre,
        usuarioId: null,
      }));

      return ApiResponseBuilder.success(response, 'Categorías globales obtenidas exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al obtener las categorías globales');
    }
  }

  async getById(id: number, usuario: Usuario): Promise<ApiResponse<CategoriaResponseDto>> {
    try {
      const categoria = await this.categoriaRepository
        .createQueryBuilder('categoria')
        .leftJoinAndSelect('categoria.usuario', 'usuario')
        .where('categoria.id = :id', { id })
        .andWhere('(usuario.id = :usuarioId OR categoria.es_global = true)', {
          usuarioId: usuario.id,
        })
        .getOne();

      if (!categoria) {
        return ApiResponseBuilder.error(404, 'Categoría no encontrada');
      }

      const response: CategoriaResponseDto = {
        id: categoria.id,
        nombre: categoria.nombre,
        usuarioId: categoria.usuario?.id || null,
      };

      return ApiResponseBuilder.success(response, 'Categoría encontrada exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al obtener la categoría');
    }
  }

  async updateCategoria(
    id: number,
    updateCategoriaDto: UpdateCategoriaDto,
    usuario: Usuario
  ): Promise<ApiResponse<CategoriaResponseDto>> {
    try {
      const categoria = await this.categoriaRepository
        .createQueryBuilder('categoria')
        .leftJoinAndSelect('categoria.usuario', 'usuario')
        .where('categoria.id = :id', { id })
        .andWhere('usuario.id = :usuarioId', { usuarioId: usuario.id })
        .getOne();

      if (!categoria) {
        return ApiResponseBuilder.error(404, 'Categoría no encontrada o no tienes permiso para modificarla');
      }

      if (updateCategoriaDto.nombre) {
        // Validar que el nuevo nombre no exista (insensible a mayúsculas/minúsculas)
        const existente = await this.categoriaRepository
          .createQueryBuilder('categoria')
          .where('LOWER(TRIM(categoria.nombre)) = LOWER(TRIM(:nombre))', {
            nombre: updateCategoriaDto.nombre,
          })
          .andWhere('categoria.id != :id', { id })
          .andWhere('(categoria.usuario_id = :usuarioId OR categoria.es_global = true)', {
            usuarioId: usuario.id,
          })
          .getOne();

        if (existente) {
          return ApiResponseBuilder.error(400, 'Ya existe una categoría con ese nombre');
        }

        categoria.nombre = updateCategoriaDto.nombre.trim();
      }

      const saved = await this.categoriaRepository.save(categoria);
      const response: CategoriaResponseDto = {
        id: saved.id,
        nombre: saved.nombre,
        usuarioId: saved.usuario?.id || null,
      };

      return ApiResponseBuilder.success(response, 'Categoría actualizada exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al actualizar la categoría');
    }
  }

  async deleteCategoria(id: number, usuario: Usuario): Promise<ApiResponse<void>> {
    try {
      const categoria = await this.categoriaRepository
        .createQueryBuilder('categoria')
        .leftJoinAndSelect('categoria.usuario', 'usuario')
        .where('categoria.id = :id', { id })
        .andWhere('usuario.id = :usuarioId', { usuarioId: usuario.id })
        .getOne();

      if (!categoria) {
        return ApiResponseBuilder.error(404, 'Categoría no encontrada o no tienes permiso para eliminarla');
      }

      if (categoria.es_global) {
        return ApiResponseBuilder.error(400, 'No se pueden eliminar categorías globales');
      }

      await this.categoriaRepository.softRemove(categoria);
      return ApiResponseBuilder.success(null, 'Categoría eliminada exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al eliminar la categoría');
    }
  }
}
