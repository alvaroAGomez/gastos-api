import { Gasto } from 'src/Gasto/gasto.entity';
import { Cuota } from 'src/Cuota/cuota.entity';

/**
 * MapperHelper functions for Gasto transformations
 * Provides reusable logic for converting Gasto and Cuota entities to response DTOs
 */
export class GastoMapperHelper {
  /**
   * Transform Cuota array into GastoDashboardDto array
   * Used in getGastosDashboard()
   * Uses fecha_cuota (not fecha_compra) and monto_cuota (not full monto)
   * so installments from prior months correctly appear in the current period
   */
  static mapToGastoDashboard(cuotas: Cuota[], cuotasMap: { [gastoId: number]: number }): any[] {
    return cuotas.map((cuota) => {
      const totalCuotas = cuotasMap[cuota.gasto.id] || 1;
      const esCuotas = totalCuotas > 1;

      return {
        id: cuota.gasto.id,
        cuotaId: cuota.id,
        fecha: this.formatearFecha(cuota.fecha_cuota),
        fechaCompra: this.formatearFecha(cuota.gasto.fecha_compra),
        descripcion: cuota.gasto.descripcion,
        monto: Number(cuota.monto_cuota),
        montoTotal: esCuotas ? Number(cuota.gasto.monto) : undefined,
        moneda: cuota.moneda,
        categoria: {
          id: cuota.gasto.categoria.id,
          nombre: cuota.gasto.categoria.nombre,
          color_hex: cuota.gasto.categoria.color_hex,
          icono: cuota.gasto.categoria.icono,
        },
        tarjeta: {
          id: cuota.gasto.tarjeta.id,
          nombre: cuota.gasto.tarjeta.nombre,
          banco: {
            id: cuota.gasto.tarjeta.banco.id,
            nombre: cuota.gasto.tarjeta.banco.nombre,
          },
        },
        totalCuotas: esCuotas ? totalCuotas : undefined,
        cuotaActual: esCuotas ? cuota.numero : undefined,
        esDebitoAuto: cuota.gasto.es_debito_auto,
      };
    });
  }

  /**
   * Fallback: map Gasto[] (without cuotas) to dashboard format
   * Used for legacy debito gastos created before the cuota-creation fix
   */
  static mapGastoSinCuotaToDashboard(gastos: Gasto[]): any[] {
    return gastos.map((gasto) => ({
      id: gasto.id,
      cuotaId: undefined,
      fecha: this.formatearFecha(gasto.fecha_compra),
      fechaCompra: this.formatearFecha(gasto.fecha_compra),
      descripcion: gasto.descripcion,
      monto: Number(gasto.monto),
      moneda: gasto.moneda,
      categoria: {
        id: gasto.categoria.id,
        nombre: gasto.categoria.nombre,
        color_hex: gasto.categoria.color_hex,
        icono: gasto.categoria.icono,
      },
      tarjeta: {
        id: gasto.tarjeta.id,
        nombre: gasto.tarjeta.nombre,
        banco: {
          id: gasto.tarjeta.banco.id,
          nombre: gasto.tarjeta.banco.nombre,
        },
      },
      esDebitoAuto: gasto.es_debito_auto,
    }));
  }

  /**
   * Transform Cuota array into GastoCompletoDto array
   * Used in getGastosCompletos()
   * Maps cuotas with their associated gastos and calculates cuota descriptions
   */
  static mapToGastoCompleto(cuotas: Cuota[], cuotasMap: { [gastoId: number]: number }): any[] {
    return cuotas.map((cuota) => {
      const fechaCuota = cuota.fecha_cuota instanceof Date ? cuota.fecha_cuota : new Date(cuota.fecha_cuota);
      const totalCuotas = cuotasMap[cuota.gasto.id] || 1;

      let descripcion = cuota.gasto.descripcion || '';
      if (totalCuotas > 1) {
        descripcion += ` (${cuota.numero}/${totalCuotas})`;
      }

      return {
        id: cuota.id,
        gastoId: cuota.gasto.id,
        fecha: fechaCuota.toISOString().split('T')[0],
        descripcion: descripcion,
        categoria: {
          id: cuota.gasto.categoria.id,
          nombre: cuota.gasto.categoria.nombre,
          color_hex: cuota.gasto.categoria.color_hex,
          icono: cuota.gasto.categoria.icono,
        },
        monto: Number(cuota.monto_cuota),
        montoTotal: Number(cuota.gasto.monto),
        moneda: cuota.moneda,
        tarjeta: {
          id: cuota.gasto.tarjeta.id,
          nombre: cuota.gasto.tarjeta.nombre,
          banco: cuota.gasto.tarjeta.banco.nombre,
        },
        tipo: 'Crédito',
        totalCuotas: totalCuotas > 1 ? totalCuotas : undefined,
        cuotaActual: cuota.numero,
        esDebitoAuto: cuota.gasto.es_debito_auto,
      };
    });
  }

  /**
   * Formatea una fecha a formato YYYY-MM-DD
   */
  private static formatearFecha(fecha: Date | string): string {
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    const año = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }
}
