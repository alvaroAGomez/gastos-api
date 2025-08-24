// src/modules/gastos/gastos.scheduler.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DebitoConfig } from 'src/DebitoConfig/debito-config.entity';
import { GastosService } from 'src/Gasto/gasto.service';

@Injectable()
export class GastosScheduler {
  constructor(
    @InjectRepository(DebitoConfig) private readonly debitoRepo: Repository<DebitoConfig>,
    private readonly gastos: GastosService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM, { timeZone: 'America/Argentina/Cordoba' })
  async materializarDebitosDelDia() {
    const hoy = new Date();
    const y = hoy.getUTCFullYear();
    const m = hoy.getUTCMonth();
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

    const activos = await this.debitoRepo.find({ where: { activo: true } });
    for (const dc of activos) {
      const diaBase = new Date(dc.fecha_suscripcion).getUTCDate();
      const diaObjetivo = Math.min(diaBase, last);

      // ¿corresponde este mes según periodicidad?
      const per = this.perMeses(dc.periodicidad);
      const diffMeses = this.diffMeses(
        new Date(
          Date.UTC(new Date(dc.fecha_suscripcion).getUTCFullYear(), new Date(dc.fecha_suscripcion).getUTCMonth(), 1)
        ),
        new Date(Date.UTC(y, m, 1))
      );
      const aplicaMes = diffMeses >= 0 && diffMeses % per === 0;

      if (aplicaMes && hoy.getUTCDate() === diaObjetivo) {
        await this.gastos.createGastoFromDebitoConfig(dc.id);
      }
    }
  }

  private perMeses(p: DebitoConfig['periodicidad']) {
    return p === 'mensual' ? 1 : p === 'bimestral' ? 2 : p === 'trimestral' ? 3 : p === 'semestral' ? 6 : 12;
  }
  private diffMeses(a1: Date, a2: Date) {
    // a2 - a1
    return (a2.getUTCFullYear() - a1.getUTCFullYear()) * 12 + (a2.getUTCMonth() - a1.getUTCMonth());
  }
}
