import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @ApiProperty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/(?=.*[A-Z])/, { message: 'Debe tener al menos una letra mayúscula' })
  @Matches(/(?=.*[a-z])/, { message: 'Debe tener al menos una letra minúscula' })
  @Matches(/(?=.*[0-9])/, { message: 'Debe tener al menos un número' })
  @Matches(/(?=.*[@$!%*?&])/, {
    message: 'Debe tener al menos un carácter especial (@$!%*?&)',
  })
  password: string;
}
