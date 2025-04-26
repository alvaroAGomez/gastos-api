import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class GastoService {
  constructor(
    @InjectRepository(Gasto) private gastoRepo: Repository<Gasto>,
    @InjectRepository(CategoriaGasto) private categoriaRepo: Repository<CategoriaGasto>,
    @InjectRepository(TarjetaCredito) private creditoRepo: Repository<TarjetaCredito>,
    @InjectRepository(TarjetaDebito) private debitoRepo: Repository<TarjetaDebito>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    private readonly cuotaService: CuotaService
  ) {}

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

    gasto.monto = dto.monto ?? gasto.monto;
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

    await this.cuotaService.eliminarCuotasPorGasto(gasto.id);
    const updated = await this.gastoRepo.save(gasto);

    if (gasto.tarjetaCredito && gasto.totalCuotas > 0) {
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
      // Ejemplo: evolución mensual
      const year = filtros.anio || new Date().getFullYear();
      const categorias = filtros.categoria; // puede ser undefined, string o array
      const tarjetaId = filtros.tarjeta;

      const query = this.gastoRepo
        .createQueryBuilder('gasto')
        .where('gasto.usuarioId = :userId', { userId })
        .andWhere('YEAR(gasto.fecha) = :year', { year });

      // Soporta múltiples categorías (array) o una sola (string/number)
      if (categorias && Array.isArray(categorias) && categorias.length > 0) {
        query.andWhere('gasto.categoria IN (:...categorias)', { categorias });
      } else if (categorias) {
        query.andWhere('gasto.categoria = :categoria', { categoria: categorias });
      }

      if (tarjetaId) query.andWhere('gasto.tarjetaCredito = :tarjeta', { tarjeta: tarjetaId });

      const rows = await query
        .select(['MONTH(gasto.fecha) as mes', 'SUM(gasto.monto) as total'])
        .groupBy('mes')
        .orderBy('mes', 'ASC')
        .getRawMany();

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
      const year = filtros.anio || new Date().getFullYear();
      const month = filtros.mes;
      const categorias = filtros.categoria; // puede ser undefined o array
      const tarjetaId = filtros.tarjeta; // id de la tarjeta actual

      const query = this.gastoRepo
        .createQueryBuilder('gasto')
        .leftJoin('gasto.categoria', 'categoria')
        .where('gasto.usuarioId = :userId', { userId })
        .andWhere('YEAR(gasto.fecha) = :year', { year });

      // Filtra por la tarjeta de crédito seleccionada
      if (tarjetaId) {
        query.andWhere('gasto.tarjetaCredito = :tarjetaId', { tarjetaId });
      }

      if (month) query.andWhere('MONTH(gasto.fecha) = :month', { month });

      if (categorias && Array.isArray(categorias) && categorias.length > 0) {
        query.andWhere('gasto.categoria IN (:...categorias)', { categorias });
      }

      // Agrupa por categoría
      const rows = await query
        .select(['categoria.nombre as categoria', 'SUM(gasto.monto) as total'])
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
              backgroundColor: [
                '#1976d2',
                '#388e3c',
                '#fbc02d',
                '#d32f2f',
                '#7b1fa2',
                '#0288d1',
                '#c2185b',
                '#ffa000',
                '#388e3c',
              ].slice(0, labels.length),
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
      const year = filtros.anio || new Date().getFullYear();
      const month = filtros.mes;
      const categorias = filtros.categoria; // puede ser undefined o array
      const tarjetaId = filtros.tarjeta;

      const query = this.gastoRepo
        .createQueryBuilder('gasto')
        .leftJoin('gasto.categoria', 'categoria')
        .where('gasto.usuarioId = :userId', { userId })
        .andWhere('YEAR(gasto.fecha) = :year', { year });

      if (tarjetaId) {
        query.andWhere('gasto.tarjetaCredito = :tarjetaId', { tarjetaId });
      }

      if (month) query.andWhere('MONTH(gasto.fecha) = :month', { month });

      if (categorias && Array.isArray(categorias) && categorias.length > 0) {
        query.andWhere('gasto.categoria IN (:...categorias)', { categorias });
      }

      // Agrupa por categoría
      const rows = await query
        .select(['categoria.nombre as categoria', 'SUM(gasto.monto) as total'])
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
              backgroundColor: [
                '#1976d2',
                '#388e3c',
                '#fbc02d',
                '#d32f2f',
                '#7b1fa2',
                '#0288d1',
                '#c2185b',
                '#ffa000',
                '#388e3c',
              ].slice(0, labels.length),
              borderColor: [
                '#1976d2',
                '#388e3c',
                '#fbc02d',
                '#d32f2f',
                '#7b1fa2',
                '#0288d1',
                '#c2185b',
                '#ffa000',
                '#388e3c',
              ].slice(0, labels.length),
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

  async findAllDashboard(userId: number): Promise<GastoDashboardDto[]> {
    const gastos = await this.gastoRepo.find({
      where: { usuario: { id: userId } },
      relations: ['categoria', 'tarjetaCredito'],
      order: { fecha: 'DESC' },
    });

    return gastos
      .filter((g) => g.tarjetaCredito) // Solo gastos con tarjeta de crédito
      .map((g) => ({
        id: g.id,
        tarjeta: g.tarjetaCredito?.nombreTarjeta ?? '',
        categoria: g.categoria?.nombre ?? '',
        monto: g.monto,
        fecha: g.fecha,
        descripcion: g.descripcion,
      }));
  }

  async getDoughnutCategoryData(userId: number): Promise<{ chartData: any }> {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const rows = await this.gastoRepo
      .createQueryBuilder('gasto')
      .leftJoin('gasto.categoria', 'categoria')
      .where('gasto.usuarioId = :userId', { userId })
      .andWhere('MONTH(gasto.fecha) = :mes', { mes })
      .andWhere('YEAR(gasto.fecha) = :anio', { anio })
      .select(['categoria.nombre as categoria', 'SUM(gasto.monto) as total'])
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
            backgroundColor: [
              '#1976d2',
              '#388e3c',
              '#fbc02d',
              '#d32f2f',
              '#7b1fa2',
              '#0288d1',
              '#c2185b',
              '#ffa000',
              '#388e3c',
            ].slice(0, labels.length),
          },
        ],
      },
    };
  }

  async getBarMonthlyEvolutionData(userId: number): Promise<{ chartData: any }> {
    const now = new Date();
    const anio = now.getFullYear();

    const rows = await this.gastoRepo
      .createQueryBuilder('gasto')
      .where('gasto.usuarioId = :userId', { userId })
      .andWhere('YEAR(gasto.fecha) = :anio', { anio })
      .select(['MONTH(gasto.fecha) as mes', 'SUM(gasto.monto) as total'])
      .groupBy('mes')
      .orderBy('mes', 'ASC')
      .getRawMany();

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

    const rows = await this.gastoRepo
      .createQueryBuilder('gasto')
      .leftJoin('gasto.tarjetaCredito', 'tarjeta')
      .where('gasto.usuarioId = :userId', { userId })
      .andWhere('MONTH(gasto.fecha) = :mes', { mes })
      .andWhere('YEAR(gasto.fecha) = :anio', { anio })
      .select(['tarjeta.nombreTarjeta as tarjeta', 'SUM(gasto.monto) as total'])
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
            backgroundColor: [
              '#1976d2',
              '#388e3c',
              '#fbc02d',
              '#d32f2f',
              '#7b1fa2',
              '#0288d1',
              '#c2185b',
              '#ffa000',
              '#388e3c',
            ].slice(0, labels.length),
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
    cuotas: gasto.totalCuotas,
    cuotasRestantes: undefined,
    cardId: gasto.tarjetaCredito?.id?.toString() ?? '',
    nameCard: gasto.tarjetaCredito?.nombreTarjeta ?? '',
  });
}
