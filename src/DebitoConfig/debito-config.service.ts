import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DebitoConfig } from './debito-config.entity';
import { CreateDebitoConfigDto } from './dto/create-debito-config.dto';
import { UpdateDebitoConfigDto } from './dto/update-debito-config.dto';
import { ApiResponse, ApiResponseBuilder } from '../common/response/api-response.builder';

@Injectable()
export class DebitoConfigService {
  constructor(
    @InjectRepository(DebitoConfig)
    private readonly debitoRepo: Repository<DebitoConfig>
  ) {}

  async createDebitoConfig(dto: CreateDebitoConfigDto): Promise<ApiResponse<any>> {
    try {
      const debitoConfig = this.debitoRepo.create({
        usuario_id: dto.usuarioId,
        tarjeta_id: dto.tarjetaId,
        categoria_id: dto.categoriaId,
        descripcion: dto.descripcion || 'Débito automático',
        monto: dto.monto,
        moneda: dto.moneda,
        fecha_suscripcion: new Date(dto.fechaSuscripcion),
        activo: true,
      });

      const saved = await this.debitoRepo.save(debitoConfig);

      return ApiResponseBuilder.success(
        { configId: saved.id },
        'Configuración de débito automático creada exitosamente'
      );
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message);
    }
  }

  async getSuscripcionesActivas(usuarioId: number): Promise<ApiResponse<any>> {
    try {
      const suscripciones = await this.debitoRepo.find({
        where: {
          usuario_id: usuarioId,
          activo: true,
        },
        relations: ['tarjeta', 'categoria'],
      });

      return ApiResponseBuilder.success({ suscripciones }, 'Suscripciones recuperadas exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(500, error.message);
    }
  }

  async getSuscripcionById(id: number, usuarioId: number): Promise<ApiResponse<any>> {
    try {
      const config = await this.debitoRepo.findOne({
        where: {
          id,
          usuario_id: usuarioId,
        },
        relations: ['tarjeta', 'categoria'],
      });

      if (!config) {
        throw new NotFoundException('Suscripción no encontrada');
      }

      return ApiResponseBuilder.success({ suscripcion: config }, 'Suscripción recuperada exitosamente');
    } catch (error) {
      if (error instanceof NotFoundException) {
        return ApiResponseBuilder.error(404, error.message);
      }
      return ApiResponseBuilder.error(500, error.message);
    }
  }

  async updateEstadoSuscripcion(id: number, usuarioId: number): Promise<ApiResponse<any>> {
    try {
      const config = await this.debitoRepo.findOne({
        where: {
          id,
          usuario_id: usuarioId,
        },
      });

      if (!config) {
        throw new NotFoundException('Suscripción no encontrada');
      }

      config.activo = false;
      await this.debitoRepo.save(config);

      return ApiResponseBuilder.success(null, 'Suscripción desactivada exitosamente');
    } catch (error) {
      if (error instanceof NotFoundException) {
        return ApiResponseBuilder.error(404, error.message);
      }
      return ApiResponseBuilder.error(500, error.message);
    }
  }

  async updateSuscripcion(id: number, dto: UpdateDebitoConfigDto, usuarioId: number): Promise<ApiResponse<any>> {
    try {
      const config = await this.debitoRepo.findOne({
        where: {
          id,
          usuario_id: usuarioId,
        },
      });

      if (!config) {
        throw new NotFoundException('Suscripción no encontrada');
      }

      // Actualizamos solo los campos que vienen en el DTO
      Object.assign(config, dto);

      const updated = await this.debitoRepo.save(config);

      return ApiResponseBuilder.success({ suscripcion: updated }, 'Suscripción actualizada exitosamente');
    } catch (error) {
      if (error instanceof NotFoundException) {
        return ApiResponseBuilder.error(404, error.message);
      }
      return ApiResponseBuilder.error(500, error.message);
    }
  }

  async getActiveConfig(configId: number): Promise<DebitoConfig | null> {
    return this.debitoRepo.findOne({
      where: {
        id: configId,
        activo: true,
      },
    });
  }
}
