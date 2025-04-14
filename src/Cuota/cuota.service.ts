import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cuota } from './cuota.entity';
import { Repository } from 'typeorm';
import { Gasto } from 'src/Gasto/gasto.entity';

@Injectable()
export class CuotaService {
  constructor(
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>
  ) {}

  async generarCuotas(gasto: Gasto): Promise<void> {
    if (!gasto.totalCuotas || gasto.totalCuotas <= 0) return;

    const montoPorCuota = +(gasto.monto / gasto.totalCuotas).toFixed(2);
    const cuotas: Cuota[] = [];

    for (let i = 0; i < gasto.totalCuotas; i++) {
      const cuota = new Cuota();
      cuota.gasto = gasto;
      cuota.numeroCuota = i + 1;
      cuota.montoCuota = montoPorCuota;

      const fecha = new Date(gasto.fecha);
      fecha.setMonth(fecha.getMonth() + i);
      cuota.fechaVencimiento = fecha;

      cuotas.push(cuota);
    }

    await this.cuotaRepo.save(cuotas);
  }

  async eliminarCuotasPorGasto(gastoId: number): Promise<void> {
    await this.cuotaRepo.delete({ gastoId }); // ✅ esta es la forma correcta
  }

  async obtenerCuotasPorGasto(gastoId: number): Promise<Cuota[]> {
    return this.cuotaRepo.find({
      where: { gastoId }, // ✅ también corregido
      order: { numeroCuota: 'ASC' },
    });
  }

  async marcarComoPagada(cuotaId: number): Promise<void> {
    await this.cuotaRepo.update(cuotaId, { pagada: true });
  }
}
