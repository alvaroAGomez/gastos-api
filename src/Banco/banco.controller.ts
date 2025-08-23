import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../Auth/current-user.decorator';
import { Usuario } from '../Usuario/usuario.entity';
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
  async createBanco(@Body() createBancoDto: CreateBancoDto, @CurrentUser() user: Usuario) {
    return this.bancoService.createBanco(createBancoDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los bancos del usuario' })
  async getBancos(@CurrentUser() user: Usuario) {
    return this.bancoService.getBancos(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un banco por ID' })
  async getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Usuario) {
    return this.bancoService.getById(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un banco' })
  async updateBanco(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBancoDto: UpdateBancoDto,
    @CurrentUser() user: Usuario
  ) {
    return this.bancoService.updateBanco(id, updateBancoDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un banco' })
  async deleteBanco(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Usuario) {
    return this.bancoService.deleteBanco(id, user);
  }
}
