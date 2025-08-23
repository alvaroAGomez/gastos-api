import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, Length, IsHexColor } from 'class-validator';

export class CreateCategoriaDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  nombre: string;

  @ApiProperty()
  @IsBoolean()
  es_global: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  color_hex?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  icono?: string;
}
