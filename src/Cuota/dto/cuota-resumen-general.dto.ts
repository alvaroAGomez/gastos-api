export interface CuotaResumenGeneralMesDto {
  mes: string;
  totalGasto: number;
}

export interface CuotaResumenGeneralResponseDto {
  resumenMensual: CuotaResumenGeneralMesDto[];
  totalAnual: number;
}
