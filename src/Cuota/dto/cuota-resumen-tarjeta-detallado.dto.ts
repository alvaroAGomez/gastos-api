export interface CuotaResumenTarjetaDetalladoMesDto {
  mes: string;
  gastoActual: number;
  montoCuotas: number;
  totalMes: number;
}

export interface CuotaResumenTarjetaDetalladoResponseDto {
  tarjetaId: number;
  nombreTarjeta: string;
  anio: number;
  resumenMensual: CuotaResumenTarjetaDetalladoMesDto[];
  totalAnual: number;
}
