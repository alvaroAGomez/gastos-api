export class GastoResponseDto {
  id: number;
  monto: number;
  fecha: Date;
  descripcion?: string;
  esEnCuotas: boolean;
  numeroCuotas?: number;
  nombreCategoria: string;
}
