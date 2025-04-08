import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuota } from './cuota.entity';
import { CreateCuotaDto } from './dto/create-cuota.dto';
import { UpdateCuotaDto } from './dto/update-cuota.dto';

@Injectable()
export class CuotaService {
  constructor(
    @InjectRepository(Cuota)
    private cuotaRepository: Repository<Cuota>
  ) {}

  async create(createCuotaDto: CreateCuotaDto): Promise<Cuota> {
    const nuevaCuota = this.cuotaRepository.create(createCuotaDto);
    return await this.cuotaRepository.save(nuevaCuota);
  }

  async findAll(): Promise<Cuota[]> {
    return await this.cuotaRepository.find();
  }

  async findOne(id: number): Promise<Cuota> {
    return await this.cuotaRepository.findOneBy({ id });
  }

  async update(id: number, updateCuotaDto: UpdateCuotaDto): Promise<Cuota> {
    await this.cuotaRepository.update(id, updateCuotaDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.cuotaRepository.delete(id);
  }
}
