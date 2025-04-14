import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class UpdateTarjetaDebitoDto {
  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  bancoId?: number;

  @ApiPropertyOptional({ example: '8765432187654321' })
  @IsString()
  @Length(16, 16)
  @IsOptional()
  numeroTarjeta?: string;

  @ApiPropertyOptional({ example: 'MasterCard Débito' })
  @IsString()
  @IsOptional()
  nombreTarjeta?: string;

  @ApiPropertyOptional({ example: 100000.0 })
  @IsNumber()
  @IsOptional()
  saldoDisponible?: number;
}
