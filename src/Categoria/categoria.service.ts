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
    private categoriaGastoRepository: Repository<CategoriaGasto>
  ) {}

  async create(dto: CreateCategoriaDto, usuario: Usuario): Promise<CategoriaResponseDto> {
    // Validar unicidad (no case sensitive)
    const exists = await this.categoriaGastoRepository
      .createQueryBuilder('categoriaGasto')
      .where('LOWER(categoriaGasto.nombre) = LOWER(:nombre)', { nombre: dto.nombre.trim() })
      .andWhere('(categoriaGasto.usuarioId = :usuarioId OR categoriaGasto.usuarioId IS NULL)', {
        usuarioId: usuario.id,
      })
      .andWhere('categoriaGasto.deletedAt IS NULL')
      .getOne();

    if (exists) {
      throw new Error('Ya existe una categoría con ese nombre');
    }

    const categoriaGasto = this.categoriaGastoRepository.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      usuario,
    });

    const saved = await this.categoriaGastoRepository.save(categoriaGasto);

    return {
      id: saved.id,
      nombre: saved.nombre,
      usuarioId: saved.usuario ? saved.usuario.id : null,
    };
  }

  async findAllForUser(usuario: Usuario): Promise<CategoriaResponseDto[]> {
    // Solo categorías del usuario (sin globales)
    const categories = await this.categoriaGastoRepository
      .createQueryBuilder('categoriaGasto')
      .leftJoinAndSelect('categoriaGasto.usuario', 'usuario')
      .where('usuario.id = :usuarioId', { usuarioId: usuario.id })
      .andWhere('categoriaGasto.deletedAt IS NULL')
      .getMany();

    return categories.map((cat) => ({
      id: cat.id,
      nombre: cat.nombre,
      usuarioId: cat.usuario ? cat.usuario.id : null,
    }));
  }

  async findAllForUserAndGlobal(usuario: Usuario): Promise<CategoriaResponseDto[]> {
    // Categorías del usuario + globales
    const categories = await this.categoriaGastoRepository
      .createQueryBuilder('categoriaGasto')
      .leftJoinAndSelect('categoriaGasto.usuario', 'usuario')
      .where('usuario.id = :usuarioId OR categoriaGasto.usuario IS NULL', { usuarioId: usuario.id })
      .andWhere('categoriaGasto.deletedAt IS NULL')
      .getMany();

    return categories.map((cat) => ({
      id: cat.id,
      nombre: cat.nombre,
      usuarioId: cat.usuario ? cat.usuario.id : null,
    }));
  }

  async update(id: number, dto: UpdateCategoriaDto, usuario: Usuario): Promise<CategoriaResponseDto> {
    const categoriaGasto = await this.categoriaGastoRepository.findOne({
      where: { id, usuario: { id: usuario.id } },
      relations: ['usuario'],
    });

    if (!categoriaGasto) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Validar unicidad si cambia el nombre
    if (dto.nombre && dto.nombre.trim().toLowerCase() !== categoriaGasto.nombre.trim().toLowerCase()) {
      const exists = await this.categoriaGastoRepository
        .createQueryBuilder('categoriaGasto')
        .where('LOWER(categoriaGasto.nombre) = LOWER(:nombre)', { nombre: dto.nombre.trim() })
        .andWhere('(categoriaGasto.usuarioId = :usuarioId OR categoriaGasto.usuarioId IS NULL)', {
          usuarioId: usuario.id,
        })
        .andWhere('categoriaGasto.deletedAt IS NULL')
        .andWhere('categoriaGasto.id != :id', { id })
        .getOne();

      if (exists) {
        throw new Error('Ya existe una categoría con ese nombre');
      }
    }

    categoriaGasto.nombre = dto.nombre ?? categoriaGasto.nombre;
    categoriaGasto.descripcion = dto.descripcion ?? categoriaGasto.descripcion;

    const updated = await this.categoriaGastoRepository.save(categoriaGasto);

    return {
      id: updated.id,
      nombre: updated.nombre,
      usuarioId: updated.usuario ? updated.usuario.id : null,
    };
  }

  async remove(id: number, usuario: Usuario): Promise<void> {
    const categoriaGasto = await this.categoriaGastoRepository.findOne({
      where: { id, usuario: { id: usuario.id } },
      relations: ['usuario'],
    });

    if (!categoriaGasto) {
      throw new NotFoundException('Categoría no encontrada o no pertenece al usuario');
    }

    if (!categoriaGasto.usuario) {
      throw new NotFoundException('No se pueden eliminar categorías globales');
    }

    await this.categoriaGastoRepository.softRemove(categoriaGasto);
  }

  async restore(id: number, usuario: Usuario): Promise<void> {
    const categoriaGasto = await this.categoriaGastoRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['usuario'],
    });

    if (!categoriaGasto || categoriaGasto.usuario?.id !== usuario.id) {
      throw new NotFoundException('Categoría no encontrada o no pertenece al usuario');
    }

    await this.categoriaGastoRepository.restore(id);
  }
}
