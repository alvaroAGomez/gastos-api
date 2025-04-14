import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateBancoDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;
}
