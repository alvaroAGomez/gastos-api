import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BancoService } from './banco.service';
import { CreateBancoDto } from './dto/create-banco.dto';
import { UpdateBancoDto } from './dto/update-banco.dto';

@ApiTags('Banco')
@UseGuards(AuthGuard('jwt'))
@Controller('bancos')
@ApiBearerAuth()
export class BancoController {
  constructor(private readonly bancoService: BancoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo banco' })
  async createBanco(@Body() createBancoDto: CreateBancoDto) {
    return this.bancoService.createBanco(createBancoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los bancos' })
  async getBancos() {
    return this.bancoService.getBancos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un banco por ID' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.bancoService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un banco' })
  async updateBanco(@Param('id', ParseIntPipe) id: number, @Body() updateBancoDto: UpdateBancoDto) {
    return this.bancoService.updateBanco(id, updateBancoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un banco' })
  async deleteBanco(@Param('id', ParseIntPipe) id: number) {
    return this.bancoService.deleteBanco(id);
  }
}
