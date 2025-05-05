import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cuota } from './cuota.entity';
import { Gasto } from 'src/Gasto/gasto.entity';
import { Usuario } from 'src/Usuario/usuario.entity';
import { CuotaResumenAnualResponseDto, CuotaResumenTarjetaDto } from './dto/cuota-resumen-mensual.dto';
import { FiltroCuotasDto } from './dto/filtro-cuotas.dto';
import { CuotaResumenGeneralResponseDto } from './dto/cuota-resumen-general.dto';
import { CuotaResumenTarjetaDetalladoResponseDto } from './dto/cuota-resumen-tarjeta-detallado.dto';
import { MESES } from 'src/common/constants/meses.const';
import { redondear } from 'src/common/utils/math.util';
import { CuotasPendientesFuturasView } from './cuotas-pendientes-futuras.view';
import { CuotasPendientesFuturasResponseDto, CuotaPendienteDetalleDto } from './dto/cuotas-pendientes-futuras.dto';

@Injectable()
export class CuotaService {
  constructor(
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,
    private readonly dataSource: DataSource
  ) {}

  // ============================================================================
  // 📦 CRUD BÁSICO DE CUOTAS
  // ============================================================================

  async generarCuotas(gasto: Gasto): Promise<void> {
    if (!gasto.totalCuotas || gasto.totalCuotas <= 0) return;

    const montoPorCuota = redondear(gasto.monto / gasto.totalCuotas);
    const cuotas: Cuota[] = [];

    for (let i = 0; i < gasto.totalCuotas; i++) {
      const fecha = new Date(gasto.fecha);
      fecha.setMonth(fecha.getMonth() + i);

      cuotas.push(
        this.cuotaRepo.create({
          gasto,
          numeroCuota: i + 1,
          montoCuota: montoPorCuota,
          fechaVencimiento: fecha,
        })
      );
    }

    await this.cuotaRepo.save(cuotas);
  }

  async eliminarCuotasPorGasto(gastoId: number): Promise<void> {
    await this.cuotaRepo.delete({ gastoId });
  }

  async obtenerCuotasPorGasto(gastoId: number): Promise<Cuota[]> {
    return this.cuotaRepo.find({
      where: { gastoId },
      order: { numeroCuota: 'ASC' },
    });
  }

  async marcarComoPagada(cuotaId: number): Promise<void> {
    await this.cuotaRepo.update(cuotaId, { pagada: true });
  }

  // ============================================================================
  // 🔎 BÚSQUEDA / FILTRADO DE CUOTAS
  // ============================================================================

  async buscarCuotas(usuario: Usuario, filtros: FiltroCuotasDto) {
    const { tarjetaId, mes, anio, pagada, page = 1, limit = 10 } = filtros;

    const query = this.getQueryBaseUsuario(usuario.id).innerJoin('gasto.tarjetaCredito', 'tarjeta');

    if (tarjetaId) query.andWhere('tarjeta.id = :tarjetaId', { tarjetaId });
    if (mes) query.andWhere('MONTH(cuota.fechaVencimiento) = :mes', { mes });
    if (anio) query.andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio });
    if (pagada !== undefined) query.andWhere('cuota.pagada = :pagada', { pagada });

    const [result, total] = await query
      .orderBy('cuota.fechaVencimiento', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: result, total };
  }

  // ============================================================================
  // 📊 RESÚMENES DE CUOTAS (MENSUALES Y ANUALES)
  // ============================================================================

  async resumenMensualActual(usuario: Usuario) {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const resumen = await this.getQueryBaseUsuario(usuario.id)
      .innerJoin('gasto.tarjetaCredito', 'tarjeta')
      .andWhere('MONTH(cuota.fechaVencimiento) = :mes', { mes })
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio })
      .select(['tarjeta.id AS tarjetaId', 'tarjeta.nombre AS nombreTarjeta', 'SUM(cuota.montoCuota) AS totalMes'])
      .groupBy('tarjeta.id')
      .addGroupBy('tarjeta.nombre')
      .getRawMany();

    return resumen.map((r) => ({
      tarjetaId: r.tarjetaId,
      nombreTarjeta: r.nombreTarjeta,
      totalMes: redondear(r.totalMes),
    }));
  }

  async obtenerResumenAnual(usuario: Usuario, anio?: number): Promise<CuotaResumenAnualResponseDto> {
    const year = anio || new Date().getFullYear();

    const cuotas = await this.getQueryBaseUsuario(usuario.id)
      .innerJoin('gasto.tarjetaCredito', 'tarjeta')
      .leftJoin('tarjeta.banco', 'banco')
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio: year })
      .select([
        'tarjeta.id AS tarjetaId',
        'tarjeta.nombre AS nombreTarjeta',
        'banco.nombre AS banco',
        'MONTH(cuota.fechaVencimiento) AS mes',
        'SUM(cuota.montoCuota) AS totalCuotas',
      ])
      .groupBy('tarjeta.id')
      .addGroupBy('mes')
      .addGroupBy('tarjeta.nombre')
      .addGroupBy('banco.nombre')
      .orderBy('tarjeta.nombre', 'ASC')
      .addOrderBy('mes', 'ASC')
      .getRawMany();

    const tarjetasMap = new Map<number, CuotaResumenTarjetaDto>();

    for (const c of cuotas) {
      const id = +c.tarjetaId;
      if (!tarjetasMap.has(id)) {
        tarjetasMap.set(id, {
          tarjetaId: id,
          nombreTarjeta: c.nombreTarjeta,
          banco: c.banco,
          anio: year,
          resumenMensual: [],
          totalAnual: 0,
        });
      }

      const tarjeta = tarjetasMap.get(id)!;
      tarjeta.resumenMensual.push({
        mes: MESES[c.mes - 1],
        totalCuotas: redondear(c.totalCuotas),
      });
      tarjeta.totalAnual += +c.totalCuotas;
    }

    const resumenPorTarjeta: CuotaResumenTarjetaDto[] = [];

    for (const tarjeta of tarjetasMap.values()) {
      const cargados = new Set(tarjeta.resumenMensual.map((m) => m.mes));
      MESES.forEach((mes) => {
        if (!cargados.has(mes)) {
          tarjeta.resumenMensual.push({ mes, totalCuotas: 0 });
        }
      });
      tarjeta.resumenMensual.sort((a, b) => MESES.indexOf(a.mes) - MESES.indexOf(b.mes));
      tarjeta.totalAnual = redondear(tarjeta.totalAnual);
      resumenPorTarjeta.push(tarjeta);
    }

    const totalGeneral = redondear(resumenPorTarjeta.reduce((acc, t) => acc + t.totalAnual, 0));

    return { resumenPorTarjeta, totalGeneral };
  }

  async obtenerResumenGeneralAnual(usuario: Usuario, anio?: number): Promise<CuotaResumenGeneralResponseDto> {
    const year = anio || new Date().getFullYear();

    const rows = await this.getQueryBaseUsuario(usuario.id)
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio: year })
      .select(['MONTH(cuota.fechaVencimiento) AS mes', 'SUM(cuota.montoCuota) AS totalGasto'])
      .groupBy('mes')
      .orderBy('mes', 'ASC')
      .getRawMany();

    const resumenMensual = MESES.map((mes, idx) => {
      const row = rows.find((r) => +r.mes === idx + 1);
      return {
        mes,
        totalGasto: redondear(+row?.totalGasto || 0),
      };
    });

    const totalAnual = redondear(resumenMensual.reduce((a, b) => a + b.totalGasto, 0));

    return { resumenMensual, totalAnual };
  }

  async obtenerResumenMensualDetalladoTarjeta(
    usuario: Usuario,
    tarjetaId: number,
    anio?: number
  ): Promise<CuotaResumenTarjetaDetalladoResponseDto> {
    const year = anio || new Date().getFullYear();

    const cuotas = await this.getQueryBaseUsuario(usuario.id)
      .innerJoin('gasto.tarjetaCredito', 'tarjeta')
      .andWhere('tarjeta.id = :tarjetaId', { tarjetaId })
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio: year })
      .select([
        'cuota.numeroCuota AS numeroCuota',
        'cuota.montoCuota AS montoCuota',
        'MONTH(cuota.fechaVencimiento) AS mes',
        'gasto.fecha AS fechaGasto',
      ])
      .addSelect('gasto.id', 'gastoId')
      .getRawMany();

    const tarjeta = await this.cuotaRepo.manager.getRepository('TarjetaCredito').findOne({
      where: { id: tarjetaId },
      relations: ['banco'],
    });

    const resumenMensual = MESES.map((mes, idx) => {
      const mesNum = idx + 1;
      const gastoActual = cuotas
        .filter((c) => +c.mes === mesNum && +c.numeroCuota === 1)
        .reduce((acc, c) => acc + +c.montoCuota, 0);

      const montoCuotas = cuotas
        .filter((c) => +c.mes === mesNum && +c.numeroCuota > 1)
        .reduce((acc, c) => acc + +c.montoCuota, 0);

      return {
        mes,
        gastoActual: redondear(gastoActual),
        montoCuotas: redondear(montoCuotas),
        totalMes: redondear(gastoActual + montoCuotas),
      };
    });

    const totalAnual = redondear(resumenMensual.reduce((a, b) => a + b.totalMes, 0));

    return {
      tarjetaId,
      nombreTarjeta: tarjeta?.nombreTarjeta ?? '',
      banco: tarjeta?.banco?.nombre || tarjeta?.banco?.nombreBanco || tarjeta?.banco?.descripcion || undefined,
      anio: year,
      resumenMensual,
      totalAnual,
    };
  }

  async obtenerCuotasPendientesFuturas(
    usuario: Usuario,
    tarjetaId: number
  ): Promise<CuotasPendientesFuturasResponseDto> {
    const repo = this.dataSource.getRepository(CuotasPendientesFuturasView);

    const detalles: CuotaPendienteDetalleDto[] = await repo.find({
      where: { usuarioId: usuario.id, tarjetaId },
      order: { fechaGasto: 'ASC' },
    });

    const totalGeneral = detalles.reduce((sum, d) => sum + Number(d.totalFaltante), 0);

    return {
      detalles,
      totalGeneral,
    };
  }

  // ============================================================================
  // 🧱 MÉTODOS PRIVADOS
  // ============================================================================

  private getQueryBaseUsuario(usuarioId: number) {
    return this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .where('gasto.usuarioId = :usuarioId', { usuarioId });
  }
}
