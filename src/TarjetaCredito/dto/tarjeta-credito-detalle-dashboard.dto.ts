import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO genérico para mostrar el resumen detallado de una tarjeta de crédito
 * Se utiliza tanto en el dashboard (para listar todas las tarjetas)
 * como en el detalle individual de una tarjeta
 */
export class TarjetaCreditoDetalleDashboardDto {
  @ApiProperty({ description: 'ID de la tarjeta de crédito' })
  tarjetaId: number;

  @ApiProperty({ description: 'Nombre de la tarjeta' })
  nombreTarjeta: string;

  @ApiProperty({ description: 'Últimos 4 dígitos de la tarjeta' })
  ultimos4: string;

  @ApiProperty({ description: 'Banco de la tarjeta de crédito' })
  banco: string;

  @ApiProperty({ description: 'Límite total de crédito' })
  limiteTotal: number;

  @ApiProperty({ description: 'Gastos del mes actual (cuotas + gastos normales + débitos)' })
  gastosEsteMes: number;

  @ApiProperty({ description: 'Gastos futuros (próximas cuotas y débitos)' })
  gastosFuturos: number;

  @ApiProperty({ description: 'Límite disponible (limiteTotal - gastosEsteMes - gastosFuturos)' })
  limiteDisponible: number;

  @ApiProperty({ description: 'Porcentaje de uso del límite (0-100)' })
  porcentajeUso: number;
}
