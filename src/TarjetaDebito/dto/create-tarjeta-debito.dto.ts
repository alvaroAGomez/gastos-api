import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class CreateTarjetaDebitoDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  bancoId: number;

  @ApiProperty({ example: '1234567812345678' })
  @IsString()
  @Length(16, 16)
  numeroTarjeta: string;

  @ApiProperty({ example: 'Visa Débito' })
  @IsString()
  nombreTarjeta: string;

  @ApiProperty({ example: 50000.5 })
  @IsNumber()
  saldoDisponible: number;
}
