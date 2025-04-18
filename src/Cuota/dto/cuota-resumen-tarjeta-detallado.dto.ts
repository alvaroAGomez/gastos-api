export interface CuotaResumenTarjetaDetalladoMesDto {
  mes: string;
  gastoActual: number;
  montoCuotas: number;
  totalMes: number;
}

export interface CuotaResumenTarjetaDetalladoResponseDto {
  tarjetaId: number;
  banco: string;
  nombreTarjeta: string;
  anio: number;
  resumenMensual: CuotaResumenTarjetaDetalladoMesDto[];
  totalAnual: number;
}
