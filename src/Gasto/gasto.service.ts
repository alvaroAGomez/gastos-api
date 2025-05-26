import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Gasto } from './gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { GastoResponseDto } from './dto/gasto-response.dto';
import { CategoriaGasto } from 'src/Categoria/categoria.entity';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { TarjetaDebito } from 'src/TarjetaDebito/tarjeta-debito.entity';
import { Usuario } from 'src/Usuario/usuario.entity';
import { CuotaService } from 'src/Cuota/cuota.service';
import { GastoTarjetaFiltroDto } from './dto/gasto-tarjeta-filtro.dto';
import { GastoDashboardDto } from './dto/gasto-dashboard.dto';
import { Cuota } from 'src/Cuota/cuota.entity';
import { GastoMensualDto } from './dto/GastoMensualDto';
import { GastoMensualView } from './gasto-mensual.view';
import { GastoDashboardFiltroDto } from './dto/gasto-dashboard-filtro.dto';

@Injectable()
export class GastoService {
  constructor(
    @InjectRepository(Gasto) private gastoRepo: Repository<Gasto>,
    @InjectRepository(CategoriaGasto) private categoriaRepo: Repository<CategoriaGasto>,
    @InjectRepository(TarjetaCredito) private creditoRepo: Repository<TarjetaCredito>,
    @InjectRepository(TarjetaDebito) private debitoRepo: Repository<TarjetaDebito>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Cuota) private cuotaRepo: Repository<Cuota>,
    private dataSource: DataSource,
    private readonly cuotaService: CuotaService
  ) {}

  private readonly MESES = [
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

  private readonly COLORS = [
    '#1976d2',
    '#388e3c',
    '#fbc02d',
    '#d32f2f',
    '#7b1fa2',
    '#0288d1',
    '#c2185b',
    '#ffa000',
    '#388e3c',
  ];

  async create(dto: CreateGastoDto, userId: number): Promise<GastoResponseDto> {
    // Validación: no se puede asociar a ambas tarjetas
    if (dto.tarjetaCreditoId && dto.tarjetaDebitoId) {
      throw new BadRequestException('No se puede asociar un gasto a tarjeta de crédito y débito al mismo tiempo.');
    }

    const gasto = new Gasto();

    gasto.usuario = await this.usuarioRepo.findOneByOrFail({ id: userId });
    gasto.categoria = await this.categoriaRepo.findOneByOrFail({ id: dto.categoriaGastoId });

    if (dto.tarjetaCreditoId) {
      gasto.tarjetaCredito = await this.creditoRepo.findOneByOrFail({ id: dto.tarjetaCreditoId });
      gasto.esEnCuotas = true;
      gasto.totalCuotas = dto.numeroCuotas && dto.numeroCuotas > 1 ? dto.numeroCuotas : 1;
    }

    if (dto.tarjetaDebitoId) {
      gasto.tarjetaDebito = await this.debitoRepo.findOneByOrFail({ id: dto.tarjetaDebitoId });
      gasto.esEnCuotas = false;
      gasto.totalCuotas = 0;
    }

    gasto.monto = dto.monto;
    gasto.fecha = new Date(dto.fecha);
    gasto.descripcion = dto.descripcion ?? '';

    const savedGasto = await this.gastoRepo.save(gasto);

    if (gasto.tarjetaCredito && gasto.totalCuotas > 0) {
      await this.cuotaService.generarCuotas(savedGasto);
    }

    return this.mapToResponseDto(savedGasto);
  }

  async findAll(userId: number): Promise<GastoResponseDto[]> {
    const gastos = await this.gastoRepo.find({
      where: { usuario: { id: userId } },
      relations: ['categoria'],
      order: { fecha: 'DESC' },
    });

    return gastos.map(this.mapToResponseDto);
  }

  async findOne(id: number, userId: number): Promise<GastoResponseDto> {
    const gasto = await this.gastoRepo.findOne({
      where: { id, usuario: { id: userId } },
      relations: ['categoria'],
    });

    if (!gasto) throw new NotFoundException('Gasto no encontrado');

    return this.mapToResponseDto(gasto);
  }

  async update(id: number, dto: UpdateGastoDto, userId: number): Promise<GastoResponseDto> {
    const gasto = await this.gastoRepo.findOne({
      where: { id, usuario: { id: userId } },
      relations: ['categoria', 'tarjetaCredito', 'tarjetaDebito'],
    });

    if (!gasto) throw new NotFoundException('Gasto no encontrado');

    // Validación: no se puede tener ambas tarjetas
    if (dto.tarjetaCreditoId && dto.tarjetaDebitoId) {
      throw new BadRequestException('No se puede asociar un gasto a tarjeta de crédito y débito al mismo tiempo.');
    }

    // Detectar si cambian fecha, cuotas o monto
    const fechaAnterior = gasto.fecha;
    const cuotasAnteriores = gasto.totalCuotas;
    const montoAnterior = Number(gasto.monto);

    if (dto.categoriaGastoId) {
      gasto.categoria = await this.categoriaRepo.findOneByOrFail({ id: dto.categoriaGastoId });
    }

    if (dto.tarjetaCreditoId !== undefined) {
      gasto.tarjetaCredito = dto.tarjetaCreditoId
        ? await this.creditoRepo.findOneByOrFail({ id: dto.tarjetaCreditoId })
        : null;
    }

    if (dto.tarjetaDebitoId !== undefined) {
      gasto.tarjetaDebito = dto.tarjetaDebitoId
        ? await this.debitoRepo.findOneByOrFail({ id: dto.tarjetaDebitoId })
        : null;
    }

    gasto.monto = typeof dto.monto === 'string' ? Number(dto.monto) : (dto.monto ?? gasto.monto);
    gasto.fecha = dto.fecha ? new Date(dto.fecha) : gasto.fecha;
    gasto.descripcion = dto.descripcion ?? gasto.descripcion;

    // Reglas para cuotas
    if (gasto.tarjetaCredito) {
      gasto.esEnCuotas = true;
      gasto.totalCuotas = dto.numeroCuotas && dto.numeroCuotas > 1 ? dto.numeroCuotas : 1;
    } else {
      gasto.esEnCuotas = false;
      gasto.totalCuotas = 0;
    }

    // Si cambió la fecha, la cantidad de cuotas o el monto, eliminar cuotas viejas y generar nuevas
    const fechaCambio = dto.fecha && new Date(dto.fecha).getTime() !== new Date(fechaAnterior).getTime();
    const cuotasCambio = dto.numeroCuotas !== undefined && dto.numeroCuotas !== cuotasAnteriores;
    const montoCambio = dto.monto !== undefined && Number(dto.monto) !== montoAnterior;

    if (fechaCambio || cuotasCambio || montoCambio) {
      await this.cuotaService.eliminarCuotasPorGasto(gasto.id);
    }

    const updated = await this.gastoRepo.save(gasto);

    if ((fechaCambio || cuotasCambio || montoCambio) && gasto.tarjetaCredito && gasto.totalCuotas > 0) {
      await this.cuotaService.generarCuotas(updated);
    }

    return this.mapToResponseDto(updated);
  }

  async remove(id: number, userId: number): Promise<void> {
    const gasto = await this.gastoRepo.findOne({
      where: { id, usuario: { id: userId } },
    });

    if (!gasto) throw new NotFoundException();

    await this.cuotaService.eliminarCuotasPorGasto(gasto.id);
    await this.gastoRepo.delete(id);
  }

  async gastosPorTarjeta(tarjetaId: number, usuarioId: number, filtros: GastoTarjetaFiltroDto) {
    const {
      page = 1,
      limit = 10,
      fechaDesde,
      fechaHasta,
      categoria,
      cuotasRestantes,
      sortField = 'fecha',
      sortDirection = 'DESC',
    } = filtros;

    const query = this.gastoRepo
      .createQueryBuilder('gasto')
      .leftJoinAndSelect('gasto.categoria', 'categoria')
      .where('gasto.tarjetaCredito = :tarjetaId', { tarjetaId })
      .andWhere('gasto.usuarioId = :usuarioId', { usuarioId });

    if (fechaDesde != '' && fechaDesde != null) query.andWhere('gasto.fecha >= :fechaDesde', { fechaDesde });
    if (fechaHasta != '' && fechaHasta != null) query.andWhere('gasto.fecha <= :fechaHasta', { fechaHasta });

    // Cambia aquí: solo filtra por categoría si no es "Todas" ni vacío
    if (categoria && categoria !== 'Todas') {
      query.andWhere('gasto.categoria = :categoriaId', { categoriaId: categoria });
    }

    query.orderBy(`gasto.${sortField}`, sortDirection as any);

    // Traer todos los gastos para calcular cuotas restantes en memoria
    const allData = await query.getMany();

    // Calcular cuotasRestantes para cada gasto
    const now = new Date();
    const gastosConCuotas = allData.map((gasto) => {
      let cuotasRestantes = 0;
      if (gasto.esEnCuotas && gasto.totalCuotas && gasto.fecha) {
        const fechaGasto = new Date(gasto.fecha);
        const mesesTranscurridos =
          (now.getFullYear() - fechaGasto.getFullYear()) * 12 + (now.getMonth() - fechaGasto.getMonth());
        cuotasRestantes = Math.max(gasto.totalCuotas - mesesTranscurridos, 0);
      }
      return {
        ...this.mapToResponseDto(gasto),
        cuotasRestantes,
      };
    });

    // Filtrar por cuotasRestantes si corresponde
    let filtered = gastosConCuotas;
    if (cuotasRestantes !== undefined && cuotasRestantes !== null && !isNaN(Number(cuotasRestantes))) {
      filtered = gastosConCuotas.filter((g) => g.cuotasRestantes === Number(cuotasRestantes));
    }

    // Paginación manual después del filtro
    const start = (page - 1) * limit;
    const end = start + limit;
    const paged = filtered.slice(start, end);

    return { data: paged, total: filtered.length };
  }

  async getChartData(chartType: string, filtros: any, userId: number) {
    if (chartType === 'line') {
      // Ahora usamos cuotas para la evolución mensual
      const year = filtros.anio || new Date().getFullYear();
      const categorias = filtros.categoria;
      const tarjetaId = filtros.tarjeta;

      const query = this.cuotaRepo
        .createQueryBuilder('cuota')
        .leftJoin('cuota.gasto', 'gasto')
        .where('gasto.usuarioId = :userId', { userId })
        .andWhere('YEAR(cuota.fechaVencimiento) = :year', { year });

      if (categorias && Array.isArray(categorias) && categorias.length > 0) {
        query.andWhere('gasto.categoria IN (:...categorias)', { categorias });
      } else if (categorias) {
        query.andWhere('gasto.categoria = :categoria', { categoria: categorias });
      }

      if (tarjetaId) query.andWhere('gasto.tarjetaCredito = :tarjeta', { tarjeta: tarjetaId });

      const rows = await query
        .select(['MONTH(cuota.fechaVencimiento) as mes', 'SUM(cuota.montoCuota) as total'])
        .groupBy('mes')
        .orderBy('mes', 'ASC')
        .getRawMany();

      const meses = this.MESES;
      const data = new Array(12).fill(0);
      rows.forEach((r) => {
        data[+r.mes - 1] = +r.total;
      });

      return {
        chartData: {
          labels: meses,
          datasets: [{ data, label: 'Total Gastado', borderColor: '#1976d2', backgroundColor: '#90caf9' }],
        },
        chartOptions: { responsive: true },
      };
    }
    if (chartType === 'doughnut') {
      // Ahora usamos cuotas para la distribución por categoría
      const year = filtros.anio || new Date().getFullYear();
      const month = filtros.mes;
      const categorias = filtros.categoria;
      const tarjetaId = filtros.tarjeta;

      const query = this.cuotaRepo
        .createQueryBuilder('cuota')
        .leftJoin('cuota.gasto', 'gasto')
        .leftJoin('gasto.categoria', 'categoria')
        .where('gasto.usuarioId = :userId', { userId })
        .andWhere('YEAR(cuota.fechaVencimiento) = :year', { year });

      if (tarjetaId) {
        query.andWhere('gasto.tarjetaCredito = :tarjetaId', { tarjetaId });
      }

      if (month) query.andWhere('MONTH(cuota.fechaVencimiento) = :month', { month });

      if (categorias && Array.isArray(categorias) && categorias.length > 0) {
        query.andWhere('gasto.categoria IN (:...categorias)', { categorias });
      }

      const rows = await query
        .select(['categoria.nombre as categoria', 'SUM(cuota.montoCuota) as total'])
        .groupBy('categoria.nombre')
        .orderBy('total', 'DESC')
        .getRawMany();

      const labels = rows.map((r) => r.categoria || 'Sin categoría');
      const data = rows.map((r) => Number(r.total));

      return {
        chartData: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: this.COLORS.slice(0, labels.length),
            },
          ],
        },
        chartOptions: {
          responsive: true,
          plugins: {
            legend: { display: true, position: 'right' },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const value = ctx.dataset.data[ctx.dataIndex];
                  const pct = total ? ((value / total) * 100).toFixed(1) : 0;
                  return `${ctx.label}: $${value} (${pct}%)`;
                },
              },
            },
          },
        },
      };
    }
    if (chartType === 'bar') {
      // Ahora usamos cuotas para la barra por categoría
      const year = filtros.anio || new Date().getFullYear();
      const month = filtros.mes;
      const categorias = filtros.categoria;
      const tarjetaId = filtros.tarjeta;

      const query = this.cuotaRepo
        .createQueryBuilder('cuota')
        .leftJoin('cuota.gasto', 'gasto')
        .leftJoin('gasto.categoria', 'categoria')
        .where('gasto.usuarioId = :userId', { userId })
        .andWhere('YEAR(cuota.fechaVencimiento) = :year', { year });

      if (tarjetaId) {
        query.andWhere('gasto.tarjetaCredito = :tarjetaId', { tarjetaId });
      }

      if (month) query.andWhere('MONTH(cuota.fechaVencimiento) = :month', { month });

      if (categorias && Array.isArray(categorias) && categorias.length > 0) {
        query.andWhere('gasto.categoria IN (:...categorias)', { categorias });
      }

      const rows = await query
        .select(['categoria.nombre as categoria', 'SUM(cuota.montoCuota) as total'])
        .groupBy('categoria.nombre')
        .orderBy('total', 'DESC')
        .getRawMany();

      const labels = rows.map((r) => r.categoria || 'Sin categoría');
      const data = rows.map((r) => Number(r.total));

      return {
        chartData: {
          labels,
          datasets: [
            {
              data,
              label: 'Gastos por Categoría',
              backgroundColor: this.COLORS.slice(0, labels.length),
              borderColor: this.COLORS.slice(0, labels.length),
              borderWidth: 1,
            },
          ],
        },
        chartOptions: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  return `$${ctx.parsed.y ?? ctx.parsed.x}`;
                },
              },
            },
          },
          scales: {
            x: { display: true, grid: { display: false, drawBorder: false } },
            y: { display: true, grid: { display: false, drawBorder: false }, beginAtZero: true },
          },
        },
      };
    }
    // ...otros tipos de gráfico...
    return { chartData: { labels: [], datasets: [] }, chartOptions: { responsive: true } };
  }

  async findAllDashboard(userId: number, filtro?: GastoDashboardFiltroDto): Promise<GastoDashboardDto[]> {
    const query = this.gastoRepo
      .createQueryBuilder('gasto')
      .leftJoinAndSelect('gasto.categoria', 'categoria')
      .leftJoinAndSelect('gasto.tarjetaCredito', 'tarjetaCredito')
      .leftJoinAndSelect('gasto.tarjetaDebito', 'tarjetaDebito')
      .where('gasto.usuarioId = :userId', { userId })
      .andWhere('gasto.tarjetaCredito IS NOT NULL') // Solo tarjeta de crédito
      .orderBy('gasto.fecha', 'DESC');

    if (filtro.fechaDesde) {
      query.andWhere('gasto.fecha >= :fechaDesde', {
        fechaDesde: new Date(filtro.fechaDesde),
      });
    }

    if (filtro.fechaHasta) {
      query.andWhere('gasto.fecha <= :fechaHasta', {
        fechaHasta: new Date(filtro.fechaHasta),
      });
    }

    if (filtro.categoriaId) {
      query.andWhere('gasto.categoriaId = :categoriaId', {
        categoriaId: filtro.categoriaId,
      });
    }

    if (filtro.tarjetaId) {
      query.andWhere('gasto.tarjetaCreditoId = :tarjetaId', {
        tarjetaId: filtro.tarjetaId,
      });
    }

    const gastos = await query.getMany();

    return gastos.map((g) => ({
      id: g.id,
      tarjeta: g.tarjetaCredito?.nombreTarjeta ?? '',
      categoria: g.categoria?.nombre ?? '',
      monto: g.monto,
      fecha: g.fecha,
      descripcion: g.descripcion,
      categoriaGastoId: g.categoria?.id ?? null,
      tarjetaCreditoId: g.tarjetaCredito?.id ?? null,
      tarjetaDebitoId: g.tarjetaDebito?.id ?? null,
      cuotas: g.totalCuotas,
      esEnCuotas: g.esEnCuotas,
    }));
  }

  async getDoughnutCategoryData(userId: number): Promise<{ chartData: any }> {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const rows = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .leftJoin('cuota.gasto', 'gasto')
      .leftJoin('gasto.categoria', 'categoria')
      .where('gasto.usuarioId = :userId', { userId })
      .andWhere('MONTH(cuota.fechaVencimiento) = :mes', { mes })
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio })
      .select(['categoria.nombre as categoria', 'SUM(cuota.montoCuota) as total'])
      .groupBy('categoria.nombre')
      .orderBy('total', 'DESC')
      .getRawMany();

    const labels = rows.map((r) => r.categoria || 'Sin categoría');
    const data = rows.map((r) => Number(r.total));

    return {
      chartData: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: this.COLORS.slice(0, labels.length),
          },
        ],
      },
    };
  }

  async getBarMonthlyEvolutionData(userId: number): Promise<{ chartData: any }> {
    const now = new Date();
    const anio = now.getFullYear();

    const rows = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .leftJoin('cuota.gasto', 'gasto')
      .where('gasto.usuarioId = :userId', { userId })
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio })
      .select(['MONTH(cuota.fechaVencimiento) as mes', 'SUM(cuota.montoCuota) as total'])
      .groupBy('mes')
      .orderBy('mes', 'ASC')
      .getRawMany();

    const meses = this.MESES;
    const data = new Array(12).fill(0);
    rows.forEach((r) => {
      data[+r.mes - 1] = +r.total;
    });

    return {
      chartData: {
        labels: meses,
        datasets: [
          {
            data,
            label: 'Total Gastado',
            backgroundColor: '#1976d2',
            borderRadius: 8,
          },
        ],
      },
    };
  }

  async getPieCardDistributionData(userId: number): Promise<{ chartData: any }> {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const rows = await this.cuotaRepo
      .createQueryBuilder('cuota')
      .leftJoin('cuota.gasto', 'gasto')
      .leftJoin('gasto.tarjetaCredito', 'tarjeta')
      .where('gasto.usuarioId = :userId', { userId })
      .andWhere('MONTH(cuota.fechaVencimiento) = :mes', { mes })
      .andWhere('YEAR(cuota.fechaVencimiento) = :anio', { anio })
      .select(['tarjeta.nombreTarjeta as tarjeta', 'SUM(cuota.montoCuota) as total'])
      .groupBy('tarjeta.nombreTarjeta')
      .orderBy('total', 'DESC')
      .getRawMany();

    const labels = rows.map((r) => r.tarjeta || 'Sin tarjeta');
    const data = rows.map((r) => Number(r.total));

    return {
      chartData: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: this.COLORS.slice(0, labels.length),
          },
        ],
      },
    };
  }

  private mapToResponseDto = (gasto: Gasto): any => ({
    id: gasto.id,
    monto: gasto.monto,
    fecha: gasto.fecha,
    descripcion: gasto.descripcion,
    categoria: gasto.categoria?.nombre ?? '',
    categoriaGastoId: gasto.categoria?.id ?? null,
    cuotas: gasto.totalCuotas,
    cuotasRestantes: undefined,
    cardId: gasto.tarjetaCredito?.id?.toString() ?? '',
    nameCard: gasto.tarjetaCredito?.nombreTarjeta ?? '',
    tarjetaCreditoId: gasto.tarjetaCredito?.id ?? null,
    tarjetaDebitoId: gasto.tarjetaDebito?.id ?? null,
  });

  async obtenerGastosMensualesPorTarjeta(usuarioId: number, tarjetaId: number): Promise<GastoMensualDto[]> {
    const repo = this.dataSource.getRepository(GastoMensualView);

    const rows = await repo.find({
      where: { usuarioId, tarjetaId },
      order: { fechaGasto: 'ASC' },
    });

    return rows.map((r) => ({
      gastoId: r.gastoId,
      fecha: r.fechaGasto,
      descripcion: r.descripcion,
      categoria: r.categoria,
      monto: Number(r.montoCuota),
      cuota: `${r.numeroCuota}/${r.totalCuotas || 1}`,
      esEnCuotas: r.esEnCuotas,
      categoriaGastoId: r.categoriaGastoId,
      totalCuotas: r.totalCuotas || 1,
    }));
  }
}
