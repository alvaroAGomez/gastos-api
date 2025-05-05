export function redondear(valor: number, decimales = 2): number {
  return +valor.toFixed(decimales);
}
