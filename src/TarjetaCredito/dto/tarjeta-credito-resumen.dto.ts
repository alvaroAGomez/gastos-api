export class TarjetaCreditoResumenDto {
  tarjetaId: number;
  nombreTarjeta: string;
  banco: string;
  ultimos4: string;
  gastoActualMensual: number;
  totalConsumosPendientes: number;
  limiteDisponible: number;
  limiteTotal: number;
}
