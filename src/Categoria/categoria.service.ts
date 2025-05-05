import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { CategoriaResponseDto } from './dto/categoria-response.dto';
import { CategoriaGasto } from './categoria.entity';
import { Usuario } from 'src/Usuario/usuario.entity';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(CategoriaGasto)
    private categoriaGastoRepository: Repository<CategoriaGasto>
  ) {}

  async crearCategoria(dto: CreateCategoriaDto, usuario: Usuario): Promise<CategoriaResponseDto> {
    await this.validarNombreUnico(dto.nombre, usuario.id);

    const categoria = this.categoriaGastoRepository.create({
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() ?? null,
      usuario,
    });

    const saved = await this.categoriaGastoRepository.save(categoria);
    return this.toResponseDto(saved);
  }

  async obtenerCategoriasDelUsuario(usuario: Usuario): Promise<CategoriaResponseDto[]> {
    const categorias = await this.categoriaGastoRepository.find({
      where: {
        usuario: { id: usuario.id },
        deletedAt: null,
      },
      relations: ['usuario'],
    });

    return categorias.map(this.toResponseDto);
  }

  async obtenerCategoriasGlobalesYDelUsuario(usuario: Usuario): Promise<CategoriaResponseDto[]> {
    const categorias = await this.categoriaGastoRepository
      .createQueryBuilder('categoria')
      .leftJoinAndSelect('categoria.usuario', 'usuario')
      .where('usuario.id = :usuarioId OR categoria.usuario IS NULL', { usuarioId: usuario.id })
      .andWhere('categoria.deletedAt IS NULL')
      .getMany();

    return categorias.map(this.toResponseDto);
  }

  async actualizarCategoria(id: number, dto: UpdateCategoriaDto, usuario: Usuario): Promise<CategoriaResponseDto> {
    const categoria = await this.obtenerCategoriaDelUsuario(id, usuario.id);

    if (dto.nombre && dto.nombre.trim().toLowerCase() !== categoria.nombre.trim().toLowerCase()) {
      await this.validarNombreUnico(dto.nombre, usuario.id, id);
    }

    categoria.nombre = dto.nombre?.trim() ?? categoria.nombre;
    categoria.descripcion = dto.descripcion?.trim() ?? categoria.descripcion;

    const updated = await this.categoriaGastoRepository.save(categoria);
    return this.toResponseDto(updated);
  }

  async eliminarCategoria(id: number, usuario: Usuario): Promise<void> {
    const categoria = await this.obtenerCategoriaDelUsuario(id, usuario.id);

    if (!categoria.usuario) {
      throw new NotFoundException('No se pueden eliminar categorías globales');
    }

    await this.categoriaGastoRepository.softRemove(categoria);
  }

  async restaurarCategoria(id: number, usuario: Usuario): Promise<void> {
    const categoria = await this.categoriaGastoRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['usuario'],
    });

    if (!categoria || categoria.usuario?.id !== usuario.id) {
      throw new NotFoundException('Categoría no encontrada o no pertenece al usuario');
    }

    await this.categoriaGastoRepository.restore(id);
  }

  // ---------------- MÉTODOS PRIVADOS ----------------

  private async validarNombreUnico(nombre: string, usuarioId: number, excluirId?: number) {
    const query = this.categoriaGastoRepository
      .createQueryBuilder('categoria')
      .where('LOWER(categoria.nombre) = LOWER(:nombre)', { nombre: nombre.trim() })
      .andWhere('(categoria.usuarioId = :usuarioId OR categoria.usuarioId IS NULL)', { usuarioId })
      .andWhere('categoria.deletedAt IS NULL');

    if (excluirId) {
      query.andWhere('categoria.id != :id', { id: excluirId });
    }

    const existente = await query.getOne();
    if (existente) {
      throw new BadRequestException('Ya existe una categoría con ese nombre');
    }
  }

  private async obtenerCategoriaDelUsuario(id: number, usuarioId: number): Promise<CategoriaGasto> {
    const categoria = await this.categoriaGastoRepository.findOne({
      where: { id, usuario: { id: usuarioId } },
      relations: ['usuario'],
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada o no pertenece al usuario');
    }

    return categoria;
  }

  private toResponseDto = (categoria: CategoriaGasto): CategoriaResponseDto => ({
    id: categoria.id,
    nombre: categoria.nombre,
    usuarioId: categoria.usuario ? categoria.usuario.id : null,
  });
}
