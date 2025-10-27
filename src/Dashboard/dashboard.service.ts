import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { Cuota } from 'src/Cuota/cuota.entity';
import { DebitoConfig } from 'src/DebitoConfig/debito-config.entity';
import { EstadoCuenta } from 'src/EstadoCuenta/estado-cuenta.entity';
import { ResumenFinancieroDto } from './dto/resumen-financiero.dto';
import { ApiResponse } from 'src/common/response/api-response.builder';
import { TarjetaCreditoService } from 'src/TarjetaCredito/tarjeta-credito.service';
import { TarjetaCreditoResumenDto } from 'src/TarjetaCredito/dto/tarjeta-credito-resumen.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(TarjetaCredito)
    private tarjetaRepo: Repository<TarjetaCredito>,
    @InjectRepository(Cuota)
    private cuotaRepo: Repository<Cuota>,
    @InjectRepository(DebitoConfig)
    private debitoConfigRepo: Repository<DebitoConfig>,
    @InjectRepository(EstadoCuenta)
    private estadoCuentaRepo: Repository<EstadoCuenta>,
    private tarjetaCreditoService: TarjetaCreditoService
  ) {}

  async getResumenFinanciero(usuarioId: number): Promise<ApiResponse<ResumenFinancieroDto>> {
    try {
      const [totalDisponible, gastosEsteMes, proximoCierre] = await Promise.all([
        this.getTotalDisponible(usuarioId),
        this.getGastosEsteMes(usuarioId),
        this.getProximoCierre(usuarioId),
      ]);

      const resumen: ResumenFinancieroDto = {
        totalDisponible,
        gastosEsteMes,
        proximoCierre,
      };

      return {
        ok: true,
        status: 200,
        data: resumen,
        message: 'Resumen financiero obtenido exitosamente',
      };
    } catch (error) {
      return {
        ok: false,
        status: 500,
        data: null,
        message: 'Error al obtener el resumen financiero',
        error: error.message,
      };
    }
  }

  // ...existing code...

  private async getTotalDisponible(usuarioId: number): Promise<number> {
    try {
      // Usar el método que ya calcula correctamente los límites disponibles
      const resumenResponse = await this.tarjetaCreditoService.obtenerResumenTarjetas(usuarioId);

      if (!resumenResponse.ok || !resumenResponse.data) {
        return 0;
      }

      let totalDisponible = 0;

      // Sumar el límite disponible de cada tarjeta (ya calculado correctamente en el servicio)
      for (const resumen of resumenResponse.data as Array<TarjetaCreditoResumenDto>) {
        const disponible = resumen.limiteDisponible || 0;
        totalDisponible += Math.max(0, disponible);

        console.log(`Tarjeta ${resumen.nombreTarjeta}: Disponible ${disponible}`);
      }

      console.log(`Total disponible: ${totalDisponible}`);
      return totalDisponible;
    } catch (error) {
      console.error('Error al calcular total disponible:', error);
      return 0;
    }
  }

  // ...existing code...

  private async getGastosEsteMes(usuarioId: number): Promise<number> {
    try {
      const fechaActual = new Date();
      const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

      // 1. Cuotas que vencen este mes
      const cuotasResult = await this.cuotaRepo
        .createQueryBuilder('cuota')
        .innerJoin('cuota.gasto', 'gasto')
        .where('gasto.usuario_id = :usuarioId', { usuarioId })
        .andWhere('cuota.fecha_cuota BETWEEN :inicioMes AND :finMes', { inicioMes, finMes })
        .select('SUM(cuota.monto_cuota)', 'total')
        .getRawOne();

      // 2. Débitos automáticos activos (se cobran cada mes)
      const debitosResult = await this.debitoConfigRepo
        .createQueryBuilder('debito')
        .innerJoin('debito.tarjeta', 'tarjeta')
        .where('tarjeta.usuario = :usuarioId', { usuarioId })
        .andWhere('debito.activo = :activo', { activo: true })
        .select('SUM(debito.monto)', 'total')
        .getRawOne();

      const totalCuotas = +(cuotasResult?.total || 0);
      const totalDebitos = +(debitosResult?.total || 0);

      return totalCuotas + totalDebitos;
    } catch (error) {
      console.error('Error al calcular gastos del mes:', error);
      return 0;
    }
  }

  private async getProximoCierre(usuarioId: number): Promise<any> {
    try {
      const fechaActual = new Date();

      // Buscar el próximo CIERRE de estados de cuenta
      const proximoEstado = await this.estadoCuentaRepo
        .createQueryBuilder('estado')
        .innerJoin('estado.tarjeta', 'tarjeta')
        .where('tarjeta.usuario.id = :usuarioId', { usuarioId })
        .andWhere('estado.fecha_cierre > :fechaActual', { fechaActual }) // Cambié a fecha_cierre
        .andWhere('estado.estado = :estadoAbierto', { estadoAbierto: 'abierto' })
        .select(['estado.fecha_cierre', 'tarjeta.nombre']) // Cambié a fecha_cierre
        .orderBy('estado.fecha_cierre', 'ASC') // Cambié a fecha_cierre
        .limit(1)
        .getOne();

      console.log('Próximo estado encontrado:', proximoEstado); // Para debug

      if (proximoEstado) {
        const fecha =
          proximoEstado.fecha_cierre instanceof Date // Cambié a fecha_cierre
            ? proximoEstado.fecha_cierre
            : new Date(proximoEstado.fecha_cierre);

        return {
          fecha: fecha.toISOString().split('T')[0],
          nombreTarjeta: proximoEstado.tarjeta.nombre,
          tipo: 'cierre', // Cambié a 'cierre'
        };
      }

      // Si no hay estados de cuenta próximos, calcular basado en dia_cierre_default
      const tarjetas = await this.tarjetaRepo.find({
        where: { usuario: { id: usuarioId } },
      });

      if (tarjetas.length === 0) {
        return null;
      }

      let proximaFecha: Date | null = null;
      let tarjetaProxima: TarjetaCredito | null = null;

      for (const tarjeta of tarjetas) {
        const fechaCierre = this.calcularProximoCierreTarjeta(fechaActual, tarjeta.dia_cierre_default); // Cambié el método

        if (!proximaFecha || fechaCierre < proximaFecha) {
          proximaFecha = fechaCierre;
          tarjetaProxima = tarjeta;
        }
      }

      return proximaFecha && tarjetaProxima
        ? {
            fecha: proximaFecha.toISOString().split('T')[0],
            nombreTarjeta: tarjetaProxima.nombre,
            tipo: 'cierre', // Cambié a 'cierre'
          }
        : null;
    } catch (error) {
      console.error('Error al calcular próximo cierre:', error);
      return null;
    }
  }

  private calcularProximoCierreTarjeta(fechaActual: Date, diaCierre: number): Date {
    // Renombré el método
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    // Crear fecha de cierre para el mes actual
    let cierre = new Date(año, mes, diaCierre);

    // Si ya pasó, usar el mes siguiente
    if (cierre <= fechaActual) {
      // Si estamos en diciembre, ir a enero del siguiente año
      if (mes === 11) {
        cierre = new Date(año + 1, 0, diaCierre);
      } else {
        cierre = new Date(año, mes + 1, diaCierre);
      }
    }

    // Ajustar si el día no existe en el mes (ej: 31 en febrero)
    const ultimoDiaMes = new Date(cierre.getFullYear(), cierre.getMonth() + 1, 0).getDate();
    if (diaCierre > ultimoDiaMes) {
      cierre.setDate(ultimoDiaMes);
    }

    return cierre;
  }
}
