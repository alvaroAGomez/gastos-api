import { Controller, Post, Get, Body, Param, Delete, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { TarjetaDebitoService } from './tarjeta-debito.service';
import { CreateTarjetaDebitoDto } from './dto/create-tarjeta-debito.dto';
import { UpdateTarjetaDebitoDto } from './dto/update-tarjeta-debito.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Usuario } from 'src/Usuario/usuario.entity';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Tarjeta Débito')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('tarjetas-debito')
export class TarjetaDebitoController {
  constructor(private readonly tarjetaDebitoService: TarjetaDebitoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva tarjeta de débito' })
  crear(@Body() dto: CreateTarjetaDebitoDto, @CurrentUser() usuario: Usuario) {
    return this.tarjetaDebitoService.crear(dto, usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tarjetas de débito' })
  obtenerTodas() {
    return this.tarjetaDebitoService.obtenerTodas();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una tarjeta de débito' })
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTarjetaDebitoDto) {
    return this.tarjetaDebitoService.actualizar(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar (baja lógica) una tarjeta de débito' })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.tarjetaDebitoService.eliminar(id);
  }
}
