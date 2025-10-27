import { ApiProperty } from '@nestjs/swagger';

export class ProximoCierreDto {
  @ApiProperty({ description: 'Fecha del próximo cierre', type: 'string', format: 'date' })
  fecha: string;

  @ApiProperty({ description: 'Nombre de la tarjeta' })
  nombreTarjeta: string;

  @ApiProperty({ description: 'Tipo de fecha (siempre será cierre)' })
  tipo: 'cierre';
}

export class ResumenFinancieroDto {
  @ApiProperty({ description: 'Total disponible entre todas las tarjetas' })
  totalDisponible: number;

  @ApiProperty({ description: 'Total gastado en el mes (compras + cuotas + débitos automáticos)' })
  gastosEsteMes: number;

  @ApiProperty({ description: 'Información del próximo cierre', nullable: true })
  proximoCierre: ProximoCierreDto | null;
}
