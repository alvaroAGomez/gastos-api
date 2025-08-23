import { ApiProperty } from '@nestjs/swagger';
import { BancoResponseDto } from 'src/Banco/dto/banco-response.dto';

export class TarjetaCreditoResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombreTarjeta: string;

  @ApiProperty()
  numeroTarjeta: string;

  @ApiProperty()
  limiteCredito: number;

  @ApiProperty()
  limiteDisponible: number;

  @ApiProperty()
  gastoActual: number;

  @ApiProperty()
  diaCierre: number;

  @ApiProperty()
  diaVencimiento: number;

  @ApiProperty()
  cierreActual: Date;

  @ApiProperty()
  vencimientoActual: Date;

  @ApiProperty({ type: () => BancoResponseDto })
  banco: BancoResponseDto;
}
