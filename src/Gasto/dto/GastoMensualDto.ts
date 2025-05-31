export class GastoMensualDto {
  gastoId: number;
  fecha: Date;
  descripcion: string;
  categoria: string;
  monto: number;
  cuota: string;
  esEnCuotas: boolean;
  categoriaGastoId: number;
  totalCuotas: number;
  mesPrimerPago: Date | null;
}
