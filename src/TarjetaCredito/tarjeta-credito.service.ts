import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TarjetaCredito } from './tarjeta-credito.entity';
import { CreateTarjetaCreditoDto } from './dto/create-tarjeta-credito.dto';
import { Usuario } from '../Usuario/usuario.entity';
import { Banco } from '../Banco/banco.entity';
import { UpdateTarjetaCreditoDto } from './dto/update-tarjeta-credito.dto';
import { TarjetaCreditoResumenDto } from './dto/tarjeta-credito-resumen.dto';
import { Cuota } from '../Cuota/cuota.entity';
import { Gasto } from '../Gasto/gasto.entity';
import { ApiResponseBuilder } from 'src/common/response/api-response.builder';
import { EstadoCuentaService } from 'src/EstadoCuenta/estado-cuenta.service';

@Injectable()
export class TarjetaCreditoService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(TarjetaCredito)
    private readonly tarjetaRepo: Repository<TarjetaCredito>,
    @InjectRepository(Banco)
    private readonly bancoRepo: Repository<Banco>,
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,
    @InjectRepository(Gasto)
    private readonly gastoRepo: Repository<Gasto>,
    private readonly estadoCuentaService: EstadoCuentaService
  ) {}

  async createTarjetaCredito2(dto: CreateTarjetaCreditoDto, usuario: Usuario) {
    try {
      const banco = await this.bancoRepo.findOneBy({ id: dto.bancoId });
      if (!usuario || !banco) {
        throw new NotFoundException('Usuario o banco no encontrado');
      }

      await this.validarTarjetaDuplicada(dto, usuario.id);

      const ultimos4 = (dto.numeroTarjeta || '').slice(-4);
      const tarjeta = this.tarjetaRepo.create({
        nombre: dto.nombreTarjeta,
        ultimos4Digitos: ultimos4,
        limite_total: dto.limiteCredito,
        dia_cierre_default: dto.diaCierreDefault,
        dia_vencimiento_default: dto.diaVencimientoDefault,
        banco,
        usuario,
      });

      const savedTarjeta = await this.tarjetaRepo.save(tarjeta);
      return ApiResponseBuilder.success(savedTarjeta, 'Tarjeta de crédito creada exitosamente');
    } catch (error) {
      if (error instanceof BadRequestException) {
        return ApiResponseBuilder.error(400, error.message);
      }
      if (error instanceof NotFoundException) {
        return ApiResponseBuilder.error(404, error.message);
      }
      return ApiResponseBuilder.error(500, 'Error al crear la tarjeta de crédito');
    }
  }

  async createTarjetaCredito(dto: CreateTarjetaCreditoDto, usuario: Usuario) {
    try {
      const banco = await this.bancoRepo.findOneBy({ id: dto.bancoId });
      if (!usuario || !banco) throw new NotFoundException('Usuario o banco no encontrado');

      await this.validarTarjetaDuplicada(dto, usuario.id);

      const ultimos4 = (dto.numeroTarjeta || '').slice(-4);

      // ⚠️ Todo en una transacción para que tarjeta + estado inicial queden atómicos
      const savedTarjeta = await this.ds.transaction(async (m) => {
        const tarjeta = m.getRepository(TarjetaCredito).create({
          nombre: dto.nombreTarjeta,
          ultimos4Digitos: ultimos4,
          limite_total: dto.limiteCredito,
          dia_cierre_default: dto.diaCierreDefault,
          dia_vencimiento_default: dto.diaVencimientoDefault,
          banco, // si preferís, podés setear banco_id: banco.id
          usuario, // idem: usuario_id: usuario.id
        });

        const tc = await m.getRepository(TarjetaCredito).save(tarjeta);

        // 👇 Estado inicial (mes actual). Usa el mismo manager (misma TX).
        await this.estadoCuentaService.ensureEstadoParaMes(
          m,
          tc,
          new Date() /* hoy */,
          /* feriados */ undefined,
          /* política día no hábil */ 'siguiente',
          /* vencimiento en mes siguiente */ true
        );

        return tc;
      });

      return ApiResponseBuilder.success(savedTarjeta, 'Tarjeta de crédito creada exitosamente');
    } catch (error) {
      if (error instanceof BadRequestException) {
        return ApiResponseBuilder.error(400, error.message);
      }
      if (error instanceof NotFoundException) {
        return ApiResponseBuilder.error(404, error.message);
      }
      return ApiResponseBuilder.error(500, 'Error al crear la tarjeta de crédito: ' + error.message);
    }
  }

  async getById(id: number, usuarioId: number) {
    try {
      const tarjeta = await this.buscarTarjetaPorId(id, usuarioId);
      return ApiResponseBuilder.success(tarjeta, 'Tarjeta encontrada exitosamente');
    } catch (error) {
      if (error instanceof NotFoundException) {
        return ApiResponseBuilder.error(404, error.message);
      }
      return ApiResponseBuilder.error(500, 'Error al obtener la tarjeta');
    }
  }

  async obtenerTarjetasCredito(usuarioId: number) {
    try {
      const tarjetas = await this.tarjetaRepo.find({
        where: { usuario: { id: usuarioId } },
        relations: ['banco'],
        order: { nombre: 'ASC' },
      });
      return ApiResponseBuilder.success(tarjetas, 'Tarjetas encontradas exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(500, 'Error al obtener las tarjetas');
    }
  }

  async obtenerResumenTarjetas(usuarioId: number) {
    try {
      const tarjetas = await this.tarjetaRepo.find({
        where: { usuario: { id: usuarioId } },
        relations: ['banco'],
        order: { nombre: 'ASC' },
      });

      const now = new Date();
      const resumenes: TarjetaCreditoResumenDto[] = [];

      for (const tarjeta of tarjetas) {
        const gastoActualMensual = await this.calcularGastoActualMensual(tarjeta.id, now);
        const totalConsumosPendientes = await this.calcularConsumosPendientes(tarjeta.id, now);
        const limiteDisponible = tarjeta.limite_total - gastoActualMensual - totalConsumosPendientes;

        resumenes.push({
          tarjetaId: tarjeta.id,
          nombreTarjeta: tarjeta.nombre,
          banco: tarjeta.banco?.nombre ?? '',
          ultimos4: tarjeta.ultimos4Digitos,
          gastoActualMensual,
          totalConsumosPendientes,
          limiteDisponible,
          limiteTotal: tarjeta.limite_total,
        });
      }

      return ApiResponseBuilder.success(resumenes, 'Resumen de tarjetas obtenido exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(500, 'Error al obtener el resumen de tarjetas');
    }
  }

  async updateTarjetaCredito(id: number, dto: UpdateTarjetaCreditoDto, usuarioId: number) {
    try {
      const tarjeta = await this.buscarTarjetaPorId(id, usuarioId);
      await this.validarTarjetaDuplicada(dto, usuarioId, id);

      const ultimos4 = dto.numeroTarjeta ? dto.numeroTarjeta.slice(-4) : tarjeta.ultimos4Digitos;
      Object.assign(tarjeta, {
        nombre: dto.nombreTarjeta || tarjeta.nombre,
        ultimos4Digitos: ultimos4,
        limite_total: dto.limiteCredito || tarjeta.limite_total,
        dia_cierre_default: dto.diaCierreDefault || tarjeta.dia_cierre_default,
        dia_vencimiento_default: dto.diaVencimientoDefault || tarjeta.dia_vencimiento_default,
        banco: dto.bancoId ? ({ id: dto.bancoId } as Banco) : tarjeta.banco,
      });

      const updatedTarjeta = await this.tarjetaRepo.save(tarjeta);
      return ApiResponseBuilder.success(updatedTarjeta, 'Tarjeta actualizada exitosamente');
    } catch (error) {
      if (error instanceof BadRequestException) {
        return ApiResponseBuilder.error(400, error.message);
      }
      if (error instanceof NotFoundException) {
        return ApiResponseBuilder.error(404, error.message);
      }
      return ApiResponseBuilder.error(500, 'Error al actualizar la tarjeta');
    }
  }

  async deleteTarjetaCredito(id: number, usuarioId: number) {
    try {
      const tarjeta = await this.buscarTarjetaPorId(id, usuarioId);
      await this.tarjetaRepo.softDelete(tarjeta.id);
      return ApiResponseBuilder.success(null, 'Tarjeta eliminada exitosamente');
    } catch (error) {
      if (error instanceof NotFoundException) {
        return ApiResponseBuilder.error(404, error.message);
      }
      return ApiResponseBuilder.error(500, 'Error al eliminar la tarjeta');
    }
  }

  private async buscarTarjetaPorId(id: number, usuarioId: number): Promise<TarjetaCredito> {
    const tarjeta = await this.tarjetaRepo.findOne({
      where: { id, usuario: { id: usuarioId } },
      relations: ['banco'],
    });

    if (!tarjeta) {
      throw new NotFoundException('Tarjeta no encontrada');
    }

    return tarjeta;
  }

  private async validarTarjetaDuplicada(
    dto: CreateTarjetaCreditoDto | UpdateTarjetaCreditoDto,
    usuarioId: number,
    excluirId?: number
  ): Promise<void> {
    const ultimos4 = (dto.numeroTarjeta || '').slice(-4);
    const nombreLower = dto.nombreTarjeta?.toLowerCase().trim();

    const qb = this.tarjetaRepo
      .createQueryBuilder('tarjeta')
      .innerJoin('tarjeta.usuario', 'usuario')
      .innerJoin('tarjeta.banco', 'banco')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('banco.id = :bancoId', { bancoId: dto.bancoId })
      .andWhere('LOWER(TRIM(tarjeta.nombre)) = :nombre', { nombre: nombreLower })
      .andWhere('tarjeta.ultimos4Digitos = :ultimos4', { ultimos4 });

    if (excluirId) {
      qb.andWhere('tarjeta.id != :id', { id: excluirId });
    }

    const tarjetaExistente = await qb.getOne();

    if (tarjetaExistente) {
      throw new BadRequestException('Ya existe una tarjeta activa con el mismo banco, nombre y últimos 4 dígitos');
    }
  }

  private async calcularGastoActualMensual(tarjetaId: number, fecha: Date): Promise<number> {
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();

    try {
      const result = await this.cuotaRepo
        .createQueryBuilder('cuota')
        .innerJoin('cuota.gasto', 'gasto')
        .where('gasto.tarjeta_id = :tarjetaId', { tarjetaId })
        .andWhere('MONTH(cuota.fecha_cuota) = :mes', { mes })
        .andWhere('YEAR(cuota.fecha_cuota) = :anio', { anio })
        .select('SUM(cuota.monto_cuota)', 'total')
        .getRawOne();

      return +(result?.total || 0);
    } catch (error) {
      console.log('Error al calcular gasto actual mensual:', error);
      throw new Error('Error al calcular gasto actual mensual');
    }
  }

  private async calcularConsumosPendientes(tarjetaId: number, fechaDesde: Date): Promise<number> {
    const fechaLimite = new Date(fechaDesde.getFullYear(), fechaDesde.getMonth() + 1, 1);
    const result = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .innerJoin('cuota.gasto', 'gasto')
      .where('gasto.tarjeta_id = :tarjetaId', { tarjetaId })
      .andWhere('cuota.fecha_cuota >= :limite', { limite: fechaLimite })
      .select('SUM(cuota.monto_cuota)', 'total')
      .getRawOne();

    return +(result?.total || 0);
  }
}
