import { ApiProperty } from '@nestjs/swagger';

export class GastoCompletoDto {
  @ApiProperty()
  id: number; // Mantenemos como ID de cuota

  @ApiProperty()
  gastoId?: number; // Agregamos ID del gasto padre

  @ApiProperty()
  fecha: string;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  categoria: {
    id: number;
    nombre: string;
    color_hex?: string;
    icono?: string;
  };

  @ApiProperty()
  monto: number;

  @ApiProperty()
  montoTotal?: number; // Agregamos monto total del gasto

  @ApiProperty()
  moneda: string;

  @ApiProperty()
  tarjeta: {
    id: number;
    nombre: string;
    banco: string;
  };

  @ApiProperty()
  tipo: string; // 'Crédito', 'Débito', etc.

  @ApiProperty()
  totalCuotas?: number;

  @ApiProperty()
  cuotaActual?: number;

  @ApiProperty()
  esDebitoAuto: boolean;
}

export class GastosCompletosResponseDto {
  @ApiProperty({ type: [GastoCompletoDto] })
  gastos: GastoCompletoDto[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  @ApiProperty()
  filtros: {
    tarjetaId?: number;
    categoriaId?: number;
    mes?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  };
}
