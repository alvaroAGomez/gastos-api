import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}
