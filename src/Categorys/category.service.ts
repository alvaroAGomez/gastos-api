import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { User } from '../users/user.entity';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>
  ) {}

  async create(dto: CreateCategoryDto, user: User): Promise<CategoryResponseDto> {
    const category = this.categoryRepository.create({
      name: dto.name,
      user,
      color: dto.color ?? null,
      icon: dto.icon ?? null,
    });

    const saved = await this.categoryRepository.save(category);

    return {
      id: saved.id,
      name: saved.name,
      userId: saved.user ? saved.user.id : null,
    };
  }

  async findAllForUser(user: User): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.user', 'user')
      .where('(user.id = :userId OR category.user IS NULL)', { userId: user.id })
      .andWhere('category.deletedAt IS NULL')
      .getMany();

    return (await categories).map((cat) => ({
      id: cat.id,
      name: cat.name,
      userId: cat.user ? cat.user.id : null,
    }));
  }

  async update(id: number, dto: UpdateCategoryDto, user: User): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['user'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    category.name = dto.name ?? category.name;
    category.color = dto.color ?? category.color;
    category.icon = dto.icon ?? category.icon;

    const updated = await this.categoryRepository.save(category);

    return {
      id: updated.id,
      name: updated.name,
      userId: updated.user ? updated.user.id : null,
    };
  }

  async remove(id: number, user: User): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['user'],
    });

    if (!category) {
      throw new NotFoundException('Category not found or not owned by user');
    }

    // Evita borrar categorías globales (user = null)
    if (!category.user) {
      throw new NotFoundException('Cannot delete global categories');
    }

    await this.categoryRepository.softRemove(category);
  }

  async restore(id: number, user: User): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: true, // Incluye las eliminadas
      relations: ['user'],
    });

    if (!category || category.user?.id !== user.id) {
      throw new NotFoundException('Category not found or not owned by user');
    }

    await this.categoryRepository.restore(id);
  }
}
