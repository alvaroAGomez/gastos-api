export class CreateTarjetaCreditoDto {
  usuarioId: number;
  bancoId: number;
  numeroTarjeta: string;
  nombreTarjeta: string;
  limiteCredito: number;
  cierreCiclo: string; // formato ISO Date
  fechaVencimiento: string; // formato ISO Date
}
