import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cuota } from './cuota.entity';
import { ApiResponse, ApiResponseBuilder } from '../common/response/api-response.builder';

interface CreateCuotaParams {
  gastoId: number;
  estadoId: number;
  montoCuota: number;
  moneda: string;
  numeroCuota: number;
  totalCuotas: number;
  fechaCuota: Date;
}

@Injectable()
export class CuotaService {
  constructor(
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,
    private readonly dataSource: DataSource
  ) {}

  async createCuota(params: CreateCuotaParams): Promise<ApiResponse<Cuota[]>> {
    if (params.totalCuotas < 1) {
      return ApiResponseBuilder.error(400, 'totalCuotas debe ser >= 1');
    }

    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        const cuotas: Cuota[] = [];
        const start = params.numeroCuota ?? 1; // si no envían, arranca en 1

        for (let i = 0; i < params.totalCuotas; i++) {
          const numero = start + i; // <-- se incrementa en cada iteración

          const fecha = new Date(params.fechaCuota);
          fecha.setMonth(fecha.getMonth() + i); // siguiente mes por cuota

          const cuota = this.cuotaRepo.create({
            id: null,
            gasto_id: params.gastoId,
            estado_id: params.estadoId,
            numero, // 1..n (o start..start+n-1)
            fecha_cuota: fecha,
            monto_cuota: params.montoCuota,
            moneda: params.moneda,
          });

          cuotas.push(cuota);
        }

        return await manager.save(Cuota, cuotas);
      });

      return ApiResponseBuilder.success(saved, `Se crearon ${saved.length} cuota(s) para el gasto ${params.gastoId}`);
    } catch (error) {
      return ApiResponseBuilder.error(500, `Error al crear las cuotas: ${error.message}`);
    }
  }
}
