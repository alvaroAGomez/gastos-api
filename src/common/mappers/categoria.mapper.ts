import { Categoria } from 'src/Categoria/categoria.entity';
import { CategoriaResponseDto } from 'src/Categoria/dto/categoria-response.dto';

/**
 * MapperHelper functions for Categoria transformations
 * Provides reusable logic for converting Categoria entities to response DTOs
 */
export class CategoriMapperHelper {
  /**
   * Transform single Categoria entity into CategoriaResponseDto
   * Used in createCategoria(), getById(), updateCategoria()
   */
  static mapToCategoriaResponseDto(categoria: Categoria): CategoriaResponseDto {
    return {
      id: categoria.id,
      nombre: categoria.nombre,
      color_hex: categoria.color_hex,
      icono: categoria.icono,
      usuario_id: categoria.usuario?.id || null,
    };
  }

  /**
   * Transform Categoria array into CategoriaResponseDto array
   * Used in getCategorias(), getCategoriasUsuario(), getCategoriasGlobales()
   */
  static mapToCategoriaResponseDtos(categorias: Categoria[]): CategoriaResponseDto[] {
    return categorias.map((cat) => this.mapToCategoriaResponseDto(cat));
  }
}
