import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { Gasto } from 'src/Gasto/gasto.entity';
import { TarjetaCreditoDetalleDashboardDto } from 'src/TarjetaCredito/dto/tarjeta-credito-detalle-dashboard.dto';
import { CuotasPendientesResponseDto } from 'src/TarjetaCredito/dto/cuota-pendiente.dto';
import { Proyeccion12MesesResponseDto } from 'src/TarjetaCredito/dto/proyeccion-12-meses.dto';

/**
 * MapperHelper functions for Tarjeta Credito transformations
 * Provides reusable logic for converting TarjetaCredito/Gasto entities to response DTOs
 */
export class TarjetaCreditoMapperHelper {
  /**
   * Transform TarjetaCredito and spending data into detailed dashboard DTO
   * Used in calcularResumenTarjetaDetallado()
   */
  static mapToDetalleDashboard(
    tarjeta: TarjetaCredito,
    gastosEsteMes: number,
    gastosFuturos: number
  ): TarjetaCreditoDetalleDashboardDto {
    const limiteDisponible = Number(tarjeta.limite_total) - (gastosEsteMes + gastosFuturos);
    const porcentajeUso =
      Number(tarjeta.limite_total) > 0 ? (1 - limiteDisponible / Number(tarjeta.limite_total)) * 100 : 0;

    return {
      tarjetaId: tarjeta.id,
      nombreTarjeta: tarjeta.nombre,
      ultimos4: tarjeta.ultimos4Digitos,
      banco: tarjeta.banco?.nombre ?? '',
      limiteTotal: Number(tarjeta.limite_total),
      gastosEsteMes,
      gastosFuturos,
      limiteDisponible: Math.max(0, limiteDisponible),
      porcentajeUso: Math.min(100, Math.max(0, porcentajeUso)),
    };
  }

  /**
   * Transform gastos array into cuotas pendientes response
   * Groups cuotas by gasto and calculates pending installments
   */
  static mapToCuotasPendientes(gastos: Gasto[], ahora: Date = new Date()): CuotasPendientesResponseDto {
    const cuotasPendientes = gastos
      .filter((g) => g.cuotas && g.cuotas.length > 1) // Solo los en cuotas
      .map((gasto) => {
        // Contar cuotas vencidas
        const cuotasVencidas = gasto.cuotas.filter((c) => new Date(c.fecha_cuota) <= ahora).length;
        const cuotaActual = Math.min(cuotasVencidas + 1, gasto.cuotas.length);
        const cuotasFaltantes = gasto.cuotas.length - cuotaActual + 1;

        // Solo incluir si hay cuotas pendientes
        if (cuotasFaltantes <= 0) return null;

        const montoCuota = Number(gasto.monto) / gasto.cuotas.length;
        const proximaCuota = gasto.cuotas[cuotaActual - 1];

        return {
          gastoId: gasto.id,
          nombreGasto: gasto.descripcion,
          categoria: {
            id: gasto.categoria.id,
            nombre: gasto.categoria.nombre,
            color_hex: gasto.categoria.color_hex,
            icono: gasto.categoria.icono,
          },
          montoTotal: Number(gasto.monto),
          moneda: gasto.moneda,
          cuotaActual,
          totalCuotas: gasto.cuotas.length,
          cuotasFaltantes,
          montoCuota,
          proximaCuotaFecha: proximaCuota ? new Date(proximaCuota.fecha_cuota).toISOString().split('T')[0] : '',
        };
      })
      .filter((c) => c !== null);

    const totalPendiente = cuotasPendientes.reduce((sum, c) => sum + c.montoCuota * c.cuotasFaltantes, 0);

    return {
      cuotasPendientes,
      totalPendiente,
      totalGastosConCuotasPendientes: cuotasPendientes.length,
    };
  }

  /**
   * Transform gastos and debitos into 12-month projection response
   * Groups monthly spending and calculates statistics
   */
  static mapToProyeccion12Meses(
    gastos: Gasto[],
    debitos: any[],
    ahora: Date = new Date()
  ): Proyeccion12MesesResponseDto {
    const gastosPorMes = new Map<string, { cuotas: number; debitos: number }>();

    // Inicializar 12 meses
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() + i, 1);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      gastosPorMes.set(mesKey, { cuotas: 0, debitos: 0 });
    }

    // Distribuir cuotas en los 12 meses
    gastos.forEach((gasto) => {
      if (gasto.cuotas && gasto.cuotas.length > 0) {
        gasto.cuotas.forEach((cuota) => {
          const fecha = new Date(cuota.fecha_cuota);
          // Solo contar cuotas futuras
          if (fecha >= ahora) {
            const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            if (gastosPorMes.has(mesKey)) {
              gastosPorMes.get(mesKey).cuotas += Number(cuota.monto_cuota);
            }
          }
        });
      }
    });

    // Distribuir débitos en los 12 meses
    debitos.forEach((debito) => {
      for (let i = 0; i < 12; i++) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() + i, 1);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        if (gastosPorMes.has(mesKey)) {
          gastosPorMes.get(mesKey).debitos += Number(debito.monto);
        }
      }
    });

    // Convertir a array y calcular totales
    const gastosMensuales = Array.from(gastosPorMes.entries()).map(([mes, datos]) => ({
      mes,
      nombreMes: this.getNombreMes(mes),
      total: datos.cuotas + datos.debitos,
      cantidadCuotas: Math.ceil(datos.cuotas / 100), // Aproximado
      totalDebitos: datos.debitos,
    }));

    const totalProyectado = gastosMensuales.reduce((sum, m) => sum + m.total, 0);
    const promedioMensual = totalProyectado / 12;

    const mesConMayorGasto = gastosMensuales.reduce((max, m) => (m.total > max.total ? m : max));
    const mesConMenorGasto = gastosMensuales.reduce((min, m) => (m.total < min.total ? m : min));

    return {
      gastosPorMes: gastosMensuales,
      totalProyectado12Meses: totalProyectado,
      promedioMensual,
      mesConMayorGasto: {
        mes: mesConMayorGasto.mes,
        nombreMes: mesConMayorGasto.nombreMes,
        total: mesConMayorGasto.total,
      },
      mesConMenorGasto: {
        mes: mesConMenorGasto.mes,
        nombreMes: mesConMenorGasto.nombreMes,
        total: mesConMenorGasto.total,
      },
    };
  }

  /**
   * Convierte una fecha en formato YYYY-MM a nombre del mes en español
   */
  private static getNombreMes(mesStr: string): string {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const [, mes] = mesStr.split('-');
    const mesIndex = parseInt(mes) - 1;
    return meses[mesIndex] || mesStr;
  }
}
