import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gasto } from '../gasto.entity';

export class GastoResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  monto: number;

  @ApiProperty()
  fecha: Date;

  @ApiPropertyOptional()
  descripcion?: string;

  @ApiProperty()
  esEnCuotas: boolean;

  @ApiProperty()
  esSuscripcion: boolean;

  @ApiPropertyOptional()
  numeroCuotas?: number;

  @ApiProperty()
  categoria: string;

  @ApiPropertyOptional()
  cuotas?: number;

  @ApiPropertyOptional()
  cuotasRestantes?: number;

  @ApiPropertyOptional()
  cardId?: string;

  @ApiPropertyOptional()
  nameCard?: string;

  @ApiPropertyOptional()
  mesPrimerPago?: string;

  @ApiPropertyOptional()
  gastoRecurrenteId?: number;

  @ApiPropertyOptional()
  frecuencia?: string;

  /* static fromEntity(gasto: Gasto): GastoResponseDto {
    const response = new GastoResponseDto();
    response.id = gasto.id;
    response.monto = gasto.monto;
    response.fecha = gasto.fecha;
    response.descripcion = gasto.descripcion;
    response.esEnCuotas = gasto.esEnCuotas;
    response.esSuscripcion = gasto.esSuscripcion;
    response.numeroCuotas = gasto.totalCuotas;
    response.categoria = gasto.categoria?.nombre;
    response.mesPrimerPago = gasto.mesPrimerPago?.toISOString().slice(0, 10);

    if (gasto.gastoRecurrente) {
      response.gastoRecurrenteId = gasto.gastoRecurrente.id;
      response.frecuencia = gasto.gastoRecurrente.frecuencia;
    }

    if (gasto.tarjetaCredito) {
      response.cardId = gasto.tarjetaCredito.id.toString();
      response.nameCard = gasto.tarjetaCredito.nombreTarjeta;
    } else if (gasto.tarjetaDebito) {
      response.cardId = gasto.tarjetaDebito.id.toString();
      response.nameCard = gasto.tarjetaDebito.nombreTarjeta;
    }

    return response;
  } */
}
