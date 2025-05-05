import { Gasto } from 'src/Gasto/gasto.entity';

export function mapToResponseDto(gasto: Gasto): any {
  return {
    id: gasto.id,
    monto: gasto.monto,
    fecha: gasto.fecha,
    descripcion: gasto.descripcion,
    categoria: gasto.categoria?.nombre ?? '',
    categoriaGastoId: gasto.categoria?.id ?? null,
    cuotas: gasto.totalCuotas,
    cuotasRestantes: undefined,
    cardId: gasto.tarjetaCredito?.id?.toString() ?? '',
    nameCard: gasto.tarjetaCredito?.nombreTarjeta ?? '',
    tarjetaCreditoId: gasto.tarjetaCredito?.id ?? null,
    tarjetaDebitoId: gasto.tarjetaDebito?.id ?? null,
  };
}
