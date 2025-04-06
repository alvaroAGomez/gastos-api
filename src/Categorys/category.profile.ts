import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { Category } from './category.entity';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      // Mapeos para la entidad Category

      // CreateCategoryDto -> Category (al crear)
      createMap(mapper, CreateCategoryDto, Category);

      // UpdateCategoryDto -> Category (al editar)
      createMap(mapper, UpdateCategoryDto, Category);

      // Category -> CategoryResponseDto (al devolver al cliente)
      /*       createMap(
        mapper,
        Category,
        CategoryResponseDto,
        forMember(
          (dest) => dest.userId,
          mapFrom((src) => src.user?.id)
        )
      ); */
    };
  }
}
