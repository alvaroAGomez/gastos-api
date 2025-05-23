import { ApiProperty } from '@nestjs/swagger';
import { BancoResponseDto } from '../../Banco/dto/banco-response.dto';

export class TarjetaDebitoResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Visa Débito' })
  nombreTarjeta: string;

  @ApiProperty({ example: '1234567812345678' })
  numeroTarjeta: string;

  @ApiProperty({ example: 50000.5 })
  saldoDisponible: number;

  @ApiProperty({ type: () => BancoResponseDto })
  banco: BancoResponseDto;
}
