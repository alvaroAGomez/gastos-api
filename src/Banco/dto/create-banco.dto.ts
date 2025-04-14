import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateBancoDto {
  @ApiProperty()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty()
  @IsNotEmpty()
  pais: string;
}
