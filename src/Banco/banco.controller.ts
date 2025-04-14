import { UseGuards, Controller, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Usuario } from 'src/Usuario/usuario.entity';
import { BancoService } from './banco.service';

@ApiTags('Banco')
@UseGuards(AuthGuard('jwt'))
@Controller('bancos')
@ApiBearerAuth()
export class BancoController {
  constructor(private readonly bancoService: BancoService) {}

  /*   @Post()
  crear(@Body() createBancoDto: CreateBancoDto, @CurrentUser() usuario: Usuario) {
    return this.bancoService.crear(createBancoDto, usuario);
  }
 */
  @Get()
  obtenerTodos(@CurrentUser() usuario: Usuario) {
    return this.bancoService.obtenerTodosPorUsuario(usuario.id);
  }
  /* 
  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number, @CurrentUser() usuario: Usuario) {
    return this.bancoService.obtenerPorId(id, usuario.id);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBancoDto: UpdateBancoDto,
    @CurrentUser() usuario: Usuario
  ) {
    return this.bancoService.actualizar(id, updateBancoDto, usuario.id);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number, @CurrentUser() usuario: Usuario) {
    return this.bancoService.eliminar(id, usuario.id);
  } */
}
