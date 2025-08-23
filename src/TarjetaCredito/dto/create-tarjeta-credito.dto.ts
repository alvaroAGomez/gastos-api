import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsNumber, Length } from 'class-validator';

export class CreateTarjetaCreditoDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  bancoId: number;

  @ApiProperty({ example: '1234567812345678' })
  @IsString()
  @Length(4, 4)
  numeroTarjeta: string;

  @ApiProperty({ example: 'Visa Gold' })
  @IsString()
  nombreTarjeta: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  limiteCredito: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  diaCierreDefault: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  diaVencimientoDefault: number;
}
