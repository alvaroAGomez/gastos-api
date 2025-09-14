import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banco } from './banco.entity';
import { CreateBancoDto } from './dto/create-banco.dto';
import { UpdateBancoDto } from './dto/update-banco.dto';
import { BancoResponseDto } from './dto/banco-response.dto';
import { ApiResponse, ApiResponseBuilder } from '../common/response/api-response.builder';

@Injectable()
export class BancoService {
  constructor(
    @InjectRepository(Banco)
    private readonly bancoRepository: Repository<Banco>
  ) {}

  async createBanco(createBancoDto: CreateBancoDto): Promise<ApiResponse<BancoResponseDto>> {
    try {
      const banco = this.bancoRepository.create({
        nombre: createBancoDto.nombre,
        logo_url: createBancoDto.logo_url,
      });

      const savedBanco = await this.bancoRepository.save(banco);
      const response: BancoResponseDto = {
        id: savedBanco.id,
        nombre: savedBanco.nombre,
        logo_url: savedBanco.logo_url,
      };

      return ApiResponseBuilder.success(response, 'Banco creado exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al crear el banco');
    }
  }

  async getBancos(): Promise<ApiResponse<BancoResponseDto[]>> {
    try {
      const bancos = await this.bancoRepository.find();

      const response = bancos.map((banco) => ({
        id: banco.id,
        nombre: banco.nombre,
        logo_url: banco.logo_url,
      }));

      return ApiResponseBuilder.success(response, 'Bancos obtenidos exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al obtener los bancos');
    }
  }

  async getById(id: number): Promise<ApiResponse<BancoResponseDto>> {
    try {
      const banco = await this.bancoRepository.findOne({
        where: { id },
      });

      if (!banco) {
        return ApiResponseBuilder.error(404, 'Banco no encontrado');
      }

      const response: BancoResponseDto = {
        id: banco.id,
        nombre: banco.nombre,
        logo_url: banco.logo_url,
      };

      return ApiResponseBuilder.success(response, 'Banco encontrado exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al obtener el banco');
    }
  }

  async updateBanco(id: number, updateBancoDto: UpdateBancoDto): Promise<ApiResponse<BancoResponseDto>> {
    try {
      const exists = await this.getById(id);
      if (!exists.ok) {
        return exists;
      }

      const updated = await this.bancoRepository.preload({
        id: id,
        ...updateBancoDto,
      });

      if (!updated) {
        return ApiResponseBuilder.error(404, 'Banco no encontrado');
      }

      const savedBanco = await this.bancoRepository.save(updated);
      const response: BancoResponseDto = {
        id: savedBanco.id,
        nombre: savedBanco.nombre,
        logo_url: savedBanco.logo_url,
      };

      return ApiResponseBuilder.success(response, 'Banco actualizado exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al actualizar el banco');
    }
  }

  async deleteBanco(id: number): Promise<ApiResponse<void>> {
    try {
      const bancoToDelete = await this.bancoRepository.findOne({
        where: { id },
      });

      if (!bancoToDelete) {
        return ApiResponseBuilder.error(404, 'Banco no encontrado');
      }

      await this.bancoRepository.remove(bancoToDelete);
      return ApiResponseBuilder.success(null, 'Banco eliminado exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al eliminar el banco');
    }
  }
}
