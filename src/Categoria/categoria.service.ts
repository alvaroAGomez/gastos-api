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
    const categories = await this.categoriaGastoRepository
      .createQueryBuilder('categoriaGasto')
      .leftJoinAndSelect('categoriaGasto.usuario', 'usuario')
      .where('(usuario.id = :usuarioId OR categoriaGasto.usuario IS NULL)', { usuarioId: usuario.id })
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
