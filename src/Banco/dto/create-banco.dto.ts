import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Length, IsUrl } from 'class-validator';

export class CreateBancoDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  nombre: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  @Length(1, 200)
  logo_url?: string;
}
