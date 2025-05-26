import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({ name: 'VW_GastosMensualesTarjeta', synchronize: false })
export class GastoMensualView {
  @ViewColumn()
  gastoId: number;

  @ViewColumn()
  fechaGasto: Date;

  @ViewColumn()
  descripcion: string;

  @ViewColumn()
  categoria: string;

  @ViewColumn()
  montoCuota: number;

  @ViewColumn()
  numeroCuota: number;

  @ViewColumn()
  totalCuotas: number;

  @ViewColumn()
  usuarioId: number;

  @ViewColumn()
  tarjetaId: number;

  @ViewColumn()
  esEnCuotas: boolean;

  @ViewColumn()
  categoriaGastoId: number;
}
