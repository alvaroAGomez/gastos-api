import { BancoResponseDto } from 'src/Banco/dto/banco-response.dto';

export class TarjetaDebitoResponseDto {
  id: number;
  nombreTarjeta: string;
  numeroTarjeta: string;
  saldoDisponible: number;
  banco: BancoResponseDto;
}
