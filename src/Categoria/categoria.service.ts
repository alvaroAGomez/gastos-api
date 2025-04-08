import { Injectable, NotFoundException } from '@nestjs/common';
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
    private categoryRepository: Repository<CategoriaGasto>
  ) {}

  async create(dto: CreateCategoriaDto, usuario: Usuario): Promise<CategoriaResponseDto> {
    const category = this.categoryRepository.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      usuario,
    });

    const saved = await this.categoryRepository.save(category);

    return {
      id: saved.id,
      nombre: saved.nombre,
      usuarioId: saved.usuario ? saved.usuario.id : null,
    };
  }

  async findAllForUser(usuario: Usuario): Promise<CategoriaResponseDto[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.usuario', 'usuario')
      .where('(usuario.id = :usuarioId OR category.usuario IS NULL)', { usuarioId: usuario.id })
      .andWhere('category.deletedAt IS NULL')
      .getMany();

    return categories.map((cat) => ({
      id: cat.id,
      nombre: cat.nombre,
      usuarioId: cat.usuario ? cat.usuario.id : null,
    }));
  }

  async update(id: number, dto: UpdateCategoriaDto, usuario: Usuario): Promise<CategoriaResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id, usuario: { id: usuario.id } },
      relations: ['usuario'],
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    category.nombre = dto.nombre ?? category.nombre;
    category.descripcion = dto.descripcion ?? category.descripcion;

    const updated = await this.categoryRepository.save(category);

    return {
      id: updated.id,
      nombre: updated.nombre,
      usuarioId: updated.usuario ? updated.usuario.id : null,
    };
  }

  async remove(id: number, usuario: Usuario): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id, usuario: { id: usuario.id } },
      relations: ['usuario'],
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada o no pertenece al usuario');
    }

    if (!category.usuario) {
      throw new NotFoundException('No se pueden eliminar categorías globales');
    }

    await this.categoryRepository.softRemove(category);
  }

  async restore(id: number, usuario: Usuario): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['usuario'],
    });

    if (!category || category.usuario?.id !== usuario.id) {
      throw new NotFoundException('Categoría no encontrada o no pertenece al usuario');
    }

    await this.categoryRepository.restore(id);
  }
}
