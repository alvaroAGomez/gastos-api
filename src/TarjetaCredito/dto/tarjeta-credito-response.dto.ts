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
  cierreCiclo: Date;

  @ApiProperty()
  fechaVencimiento: Date;

  @ApiProperty({ type: () => BancoResponseDto })
  banco: BancoResponseDto;
}
