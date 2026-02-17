export function calcularCuotasRestantes(fecha: Date, totalCuotas: number): number {
  const now = new Date();
  const fechaGasto = new Date(fecha);
  const mesesTranscurridos =
    (now.getFullYear() - fechaGasto.getFullYear()) * 12 + (now.getMonth() - fechaGasto.getMonth());
  return Math.max(totalCuotas - mesesTranscurridos, 0);
}

/**
 * Parsea una fecha en formato string (YYYY-MM-DD) a Date sin problemas de zona horaria.
 * Soluciona el problema donde new Date(string) interpreta como UTC y pierde un día.
 *
 * @param fechaString - Fecha en formato ISO (YYYY-MM-DD)
 * @returns Date object en hora local
 *
 * @example
 * parsearFechaLocal("2025-08-23") → nuevo Date sin desplazamiento horario
 */
export function parsearFechaLocal(fechaString: string): Date {
  if (!fechaString) {
    return new Date();
  }

  // Dividir YYYY-MM-DD
  const [year, month, day] = fechaString.split('-').map(Number);

  // Crear Date en hora local (no UTC)
  // Nota: months en JavaScript son 0-indexed, así que restamos 1
  return new Date(year, month - 1, day);
}
