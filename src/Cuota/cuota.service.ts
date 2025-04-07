import { Injectable } from '@nestjs/common';
import { CreateCuotaDto } from './dto/create-cuota.dto';
import { UpdateCuotaDto } from './dto/update-cuota.dto';

@Injectable()
export class CuotaService {
  create(createCuotaDto: CreateCuotaDto) {
    return 'This action adds a new cuota';
  }

  findAll() {
    return `This action returns all cuota`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cuota`;
  }

  update(id: number, updateCuotaDto: UpdateCuotaDto) {
    return `This action updates a #${id} cuota`;
  }

  remove(id: number) {
    return `This action removes a #${id} cuota`;
  }
}
