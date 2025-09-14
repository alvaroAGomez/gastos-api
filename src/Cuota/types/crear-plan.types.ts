import { Moneda } from 'src/common/types/moneda.enum';

export type ModoPlan = 'crear' | 'editar';

export interface CrearPlanParams {
  gastoId: number;
  tarjetaId: number;
  moneda: Moneda;
  montoTotal: number;
  cantidad: number;
  fechaCompra: Date;
  numeroInicial?: number;
  modo?: ModoPlan;
  forzar?: boolean;
}
