import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({ name: 'VW_CuotasPendientesFuturas', synchronize: false })
export class CuotasPendientesFuturasView {
  @ViewColumn()
  gastoId: number;

  @ViewColumn()
  descripcion: string;

  @ViewColumn()
  fechaGasto: Date;

  @ViewColumn()
  tarjetaId: number;

  @ViewColumn()
  usuarioId: number;

  @ViewColumn()
  montoCuota: number;

  @ViewColumn()
  cuotasPendientes: number;

  @ViewColumn()
  totalFaltante: number;
}
