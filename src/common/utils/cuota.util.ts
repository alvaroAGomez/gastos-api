export function calcularCuotasRestantes(fecha: Date, totalCuotas: number): number {
  const now = new Date();
  const fechaGasto = new Date(fecha);
  const mesesTranscurridos =
    (now.getFullYear() - fechaGasto.getFullYear()) * 12 + (now.getMonth() - fechaGasto.getMonth());
  return Math.max(totalCuotas - mesesTranscurridos, 0);
}
