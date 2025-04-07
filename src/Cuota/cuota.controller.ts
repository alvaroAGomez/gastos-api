import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { CreateCuotaDto } from './dto/create-cuota.dto';
import { UpdateCuotaDto } from './dto/update-cuota.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Cuota')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('cuota')
export class CuotaController {
  constructor(private readonly cuotaService: CuotaService) {}

  @Post()
  create(@Body() createCuotaDto: CreateCuotaDto) {
    return this.cuotaService.create(createCuotaDto);
  }

  @Get()
  findAll() {
    return this.cuotaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cuotaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCuotaDto: UpdateCuotaDto) {
    return this.cuotaService.update(+id, updateCuotaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cuotaService.remove(+id);
  }
}
