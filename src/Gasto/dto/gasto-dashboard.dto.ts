import { ApiProperty } from '@nestjs/swagger';

export class GastoDashboardDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fecha: string;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  monto: number;

  @ApiProperty()
  moneda: string;

  @ApiProperty()
  categoria: {
    id: number;
    nombre: string;
    color_hex?: string;
    icono?: string;
  };

  @ApiProperty()
  tarjeta: {
    id: number;
    nombre: string;
    banco: {
      id: number;
      nombre: string;
    };
  };

  @ApiProperty()
  totalCuotas?: number;

  @ApiProperty()
  esDebitoAuto: boolean;
}

export class GastosDashboardResponseDto {
  @ApiProperty({ type: [GastoDashboardDto] })
  gastos: GastoDashboardDto[];

  @ApiProperty()
  periodo: {
    desde: string;
    hasta: string;
    esFiltroPorDefecto: boolean;
  };
}
