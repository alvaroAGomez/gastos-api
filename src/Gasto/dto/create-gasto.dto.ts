export class CreateGastoDto {
  tarjetaCreditoId?: number;
  tarjetaDebitoId?: number;
  categoriaGastoId: number;
  monto: number;
  fecha: string; // formato ISO Date
  descripcion?: string;
  esEnCuotas: boolean;
  numeroCuotas?: number;
}
