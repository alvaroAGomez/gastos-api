import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cuota } from './cuota.entity';
import { Repository } from 'typeorm';
import { Gasto } from 'src/Gasto/gasto.entity';
import { Usuario } from 'src/Usuario/usuario.entity';
import { CuotaResumenAnualResponseDto, CuotaResumenTarjetaDto } from './dto/cuota-resumen-mensual.dto';
import { FiltroCuotasDto } from './dto/filtro-cuotas.dto';
import { CuotaResumenGeneralResponseDto } from './dto/cuota-resumen-general.dto';
import { CuotaResumenTarjetaDetalladoResponseDto } from './dto/cuota-resumen-tarjeta-detallado.dto';

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

  async obtenerResumenAnual(usuario: Usuario, anio?: number): Promise<CuotaResumenAnualResponseDto> {
    const year = anio || new Date().getFullYear();

    const cuotas = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .innerJoin('gasto.tarjetaCredito', 'tarjeta')
      .leftJoin('tarjeta.banco', 'banco')
      .where('gasto.usuarioId = :usuarioId', { usuarioId: usuario.id })
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio: year })
      .select([
        'tarjeta.id AS tarjetaId',
        'tarjeta.nombre AS nombreTarjeta',
        'banco.nombre AS banco', // <-- agrega el banco aquí
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

    const resumenPorTarjeta: CuotaResumenAnualResponseDto['resumenPorTarjeta'] = [];
    const tarjetasMap = new Map<number, CuotaResumenTarjetaDto>();

    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];

    for (const cuota of cuotas) {
      const { tarjetaId, nombreTarjeta, banco, mes, totalCuotas } = cuota;

      if (!tarjetasMap.has(tarjetaId)) {
        tarjetasMap.set(tarjetaId, {
          tarjetaId,
          nombreTarjeta,
          banco, // <-- agrega el banco aquí
          anio: year,
          resumenMensual: [],
          totalAnual: 0,
        });
      }

      const resumen = tarjetasMap.get(tarjetaId)!;
      resumen.resumenMensual.push({
        mes: meses[mes - 1],
        totalCuotas: parseFloat(totalCuotas),
      });
      resumen.totalAnual += parseFloat(totalCuotas);
    }

    tarjetasMap.forEach((resumen) => {
      // completar los meses que falten con 0
      const mesesCargados = new Set(resumen.resumenMensual.map((m) => m.mes));
      for (let i = 0; i < 12; i++) {
        if (!mesesCargados.has(meses[i])) {
          resumen.resumenMensual.push({
            mes: meses[i],
            totalCuotas: 0,
          });
        }
      }

      // ordenar por mes
      resumen.resumenMensual.sort((a, b) => meses.indexOf(a.mes) - meses.indexOf(b.mes));

      resumen.totalAnual = +resumen.totalAnual.toFixed(2);
      resumenPorTarjeta.push(resumen);
    });

    const totalGeneral = +resumenPorTarjeta.reduce((acc, tarjeta) => acc + tarjeta.totalAnual, 0).toFixed(2);

    return { resumenPorTarjeta, totalGeneral };
  }

  async buscarCuotas(usuario: Usuario, filtros: FiltroCuotasDto) {
    const { tarjetaId, mes, anio, pagada, page = 1, limit = 10 } = filtros;

    const query = this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .innerJoin('gasto.tarjetaCredito', 'tarjeta')
      .where('gasto.usuarioId = :usuarioId', { usuarioId: usuario.id });

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

  async resumenMensualActual(usuario: Usuario) {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const resumen = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .innerJoin('gasto.tarjetaCredito', 'tarjeta')
      .where('gasto.usuarioId = :usuarioId', { usuarioId: usuario.id })
      .andWhere('MONTH(cuota.fechaVencimiento) = :mes', { mes })
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio })
      .select(['tarjeta.id AS tarjetaId', 'tarjeta.nombre AS nombreTarjeta', 'SUM(cuota.montoCuota) AS totalMes'])
      .groupBy('tarjeta.id')
      .addGroupBy('tarjeta.nombre')
      .getRawMany();

    return resumen.map((r) => ({
      tarjetaId: r.tarjetaId,
      nombreTarjeta: r.nombreTarjeta,
      totalMes: +r.totalMes,
    }));
  }

  async obtenerResumenGeneralAnual(usuario: Usuario, anio?: number): Promise<CuotaResumenGeneralResponseDto> {
    const year = anio || new Date().getFullYear();
    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];

    // Sumar todas las cuotas de todas las tarjetas por mes
    const rows = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .innerJoin('gasto.tarjetaCredito', 'tarjeta')
      .where('gasto.usuarioId = :usuarioId', { usuarioId: usuario.id })
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio: year })
      .select(['MONTH(cuota.fechaVencimiento) AS mes', 'SUM(cuota.montoCuota) AS totalGasto'])
      .groupBy('mes')
      .orderBy('mes', 'ASC')
      .getRawMany();

    const resumenMensual = meses.map((mes, idx) => {
      const row = rows.find((r) => +r.mes === idx + 1);
      return {
        mes,
        totalGasto: row ? parseFloat(row.totalGasto) : 0,
      };
    });

    const totalAnual = +resumenMensual.reduce((acc, m) => acc + m.totalGasto, 0).toFixed(2);

    return { resumenMensual, totalAnual };
  }

  async obtenerResumenMensualDetalladoTarjeta(
    usuario: Usuario,
    tarjetaId: number,
    anio?: number
  ): Promise<CuotaResumenTarjetaDetalladoResponseDto> {
    const year = anio || new Date().getFullYear();
    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];

    // Traer todas las cuotas de la tarjeta para el año
    const cuotas = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .innerJoin('gasto.tarjetaCredito', 'tarjeta')
      .where('gasto.usuarioId = :usuarioId', { usuarioId: usuario.id })
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

    // Obtener nombre de la tarjeta y banco
    const tarjeta = await this.cuotaRepo.manager.getRepository('TarjetaCredito').findOne({
      where: { id: tarjetaId },
      relations: ['banco'],
    });

    // Mapear por mes
    const resumenMensual = meses.map((mes, idx) => {
      const mesNum = idx + 1;
      // Gasto actual: suma de montoCuota donde numeroCuota == 1 y el vencimiento es este mes
      const gastoActual = cuotas
        .filter((c) => +c.mes === mesNum && +c.numeroCuota === 1)
        .reduce((acc, c) => acc + parseFloat(c.montoCuota), 0);

      // Monto cuotas: suma de montoCuota donde numeroCuota > 1 y el vencimiento es este mes
      const montoCuotas = cuotas
        .filter((c) => +c.mes === mesNum && +c.numeroCuota > 1)
        .reduce((acc, c) => acc + parseFloat(c.montoCuota), 0);

      return {
        mes,
        gastoActual: +gastoActual.toFixed(2),
        montoCuotas: +montoCuotas.toFixed(2),
        totalMes: +(gastoActual + montoCuotas).toFixed(2),
      };
    });

    const totalAnual = +resumenMensual.reduce((acc, m) => acc + m.totalMes, 0).toFixed(2);

    return {
      tarjetaId,
      nombreTarjeta: tarjeta?.nombreTarjeta ?? '',
      banco: tarjeta?.banco?.nombre || tarjeta?.banco?.nombreBanco || tarjeta?.banco?.descripcion || undefined,
      anio: year,
      resumenMensual,
      totalAnual,
    };
  }
}
