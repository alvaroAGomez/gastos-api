// src/modules/estados/estados.scheduler.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoCuenta } from 'src/EstadoCuenta/estado-cuenta.entity';

@Injectable()
export class EstadosScheduler {
  constructor(@InjectRepository(EstadoCuenta) private readonly estadoRepo: Repository<EstadoCuenta>) {}

  @Cron('30 0 * * *', { timeZone: 'America/Argentina/Cordoba' })
  async cerrarEstadosVencidos() {
    await this.estadoRepo
      .createQueryBuilder()
      .update(EstadoCuenta)
      .set({ estado: 'cerrado' })
      .where('estado <> :cerrado', { cerrado: 'cerrado' })
      .andWhere('fecha_cierre < CURRENT_DATE()')
      .execute();
  }
}
