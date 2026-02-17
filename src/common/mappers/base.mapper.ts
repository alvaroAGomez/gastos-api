import { MESES } from '../constants/meses.const';

/**
 * Helper functions for aggregation and transformation patterns used across mappers
 */
export class MapperHelpers {
  /**
   * Agrupa gastos por categoría y suma los montos
   * Usado en ReportesService.obtenerGastoPorCategoria()
   */
  static aggregateByCategoria(gastos: any[]): Array<{ nombre: string; total: number }> {
    const categoriaMap = new Map<number, { nombre: string; total: number }>();

    for (const gasto of gastos) {
      const categId = gasto.categoria_id;
      const categNombre = gasto.categoria?.nombre || 'Sin categoría';

      if (!categoriaMap.has(categId)) {
        categoriaMap.set(categId, { nombre: categNombre, total: 0 });
      }

      const entry = categoriaMap.get(categId);
      entry.total += Number(gasto.monto);
    }

    return Array.from(categoriaMap.values()).sort((a, b) => b.total - a.total);
  }

  /**
   * Agrupa gastos por tarjeta y suma los montos
   * Usado en ReportesService.obtenerGastoPorTarjeta()
   */
  static aggregateByTarjeta(gastos: any[]): Array<{ nombre: string; total: number }> {
    const tarjetaMap = new Map<number, { nombre: string; total: number }>();

    for (const gasto of gastos) {
      const tarjetaId = gasto.tarjeta_id;
      const tarjetaNombre = gasto.tarjeta?.nombre || 'Sin tarjeta';

      if (!tarjetaMap.has(tarjetaId)) {
        tarjetaMap.set(tarjetaId, { nombre: tarjetaNombre, total: 0 });
      }

      const entry = tarjetaMap.get(tarjetaId);
      entry.total += Number(gasto.monto);
    }

    return Array.from(tarjetaMap.values()).sort((a, b) => b.total - a.total);
  }

  /**
   * Agrupa gastos por mes (actual) y cuotas (futuro)
   * Usado en ReportesService.obtenerActualVsFuturo()
   */
  static aggregateActualVsFuturo(
    gastos: any[],
    cuotas: any[],
    cantidadMeses: number,
    year: number,
    ahora: Date = new Date()
  ): Map<string, { actual: number; futuro: number }> {
    const mesesMap = new Map<string, { actual: number; futuro: number }>();

    // Initialize months
    for (let i = 0; i < cantidadMeses; i++) {
      const fecha = new Date(year, ahora.getMonth() - cantidadMeses + i + 1, 1);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      mesesMap.set(mesKey, { actual: 0, futuro: 0 });
    }

    // Sum gastos actuales
    for (const gasto of gastos) {
      const fecha = new Date(gasto.fecha_compra);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (mesesMap.has(mesKey)) {
        mesesMap.get(mesKey).actual += Number(gasto.monto);
      }
    }

    // Sum cuotas (futuro)
    for (const cuota of cuotas) {
      const fecha = new Date(cuota.fecha_cuota);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (mesesMap.has(mesKey)) {
        mesesMap.get(mesKey).futuro += Number(cuota.monto_cuota);
      }
    }

    return mesesMap;
  }

  /**
   * Agrupa gastos y cuotas por mes para evolución
   * Usado en ReportesService.obtenerEvolucionGastos()
   */
  static aggregateEvolucionGastos(gastos: any[], cuotas: any[], mesesMap: Map<string, number>): Map<string, number> {
    const meses = new Map(mesesMap);

    // Sum gastos normales
    for (const gasto of gastos) {
      const fecha = new Date(gasto.fecha_compra);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (meses.has(mesKey)) {
        meses.set(mesKey, meses.get(mesKey) + Number(gasto.monto));
      }
    }

    // Sum cuotas
    for (const cuota of cuotas) {
      const fecha = new Date(cuota.fecha_cuota);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (meses.has(mesKey)) {
        meses.set(mesKey, meses.get(mesKey) + Number(cuota.monto_cuota));
      }
    }

    return meses;
  }

  /**
   * Convierte meses map a labels array con nombres en español
   * Usado en múltiples reportes
   */
  static getMesesLabels(mesesMap: Map<string, any>): string[] {
    return Array.from(mesesMap.keys()).map((mesKey) => {
      const [, mes] = mesKey.split('-');
      return MESES[parseInt(mes) - 1];
    });
  }

  /**
   * Oscurece un color hexadecimal
   * Usado en ReportesService para border colors
   */
  static darkenColor(hex: string, percent: number = 0.2): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8) & (0x00ff - amt));
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  /**
   * Calcula el número de cuota actual basado en fecha vencida
   * Usado en Gasto mapper para calcular cuotaActual
   */
  static calculateCuotaActual(gasto: any, ahora: Date = new Date()): number {
    if (!gasto.cuotas || gasto.cuotas.length === 0) {
      return 1;
    }

    const cuotasVencidas = gasto.cuotas.filter((c: any) => new Date(c.fecha_cuota) <= ahora).length;

    return Math.min(cuotasVencidas + 1, gasto.cuotas.length);
  }
}
