import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsNumber, IsDateString, Length } from 'class-validator';

export class CreateTarjetaCreditoDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  bancoId: number;

  @ApiProperty({ example: '1234567812345678' })
  @IsString()
  @Length(16, 16)
  numeroTarjeta: string;

  @ApiProperty({ example: 'Visa Gold' })
  @IsString()
  nombreTarjeta: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  limiteCredito: number;

  @ApiProperty({ example: '2025-05-10' })
  @IsDateString()
  cierreCiclo: string;

  @ApiProperty({ example: '2025-05-20' })
  @IsDateString()
  fechaVencimiento: string;
}
