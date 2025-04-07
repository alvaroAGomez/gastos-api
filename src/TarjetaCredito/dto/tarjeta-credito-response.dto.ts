import { BancoResponseDto } from 'src/Banco/dto/banco-response.dto';

export class TarjetaCreditoResponseDto {
  id: number;
  nombreTarjeta: string;
  numeroTarjeta: string;
  limiteCredito: number;
  cierreCiclo: Date;
  fechaVencimiento: Date;
  banco: BancoResponseDto;
}
