import { UseGuards, Controller, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../Auth/current-user.decorator';
import { Usuario } from '../Usuario/usuario.entity';
import { BancoService } from './banco.service';

@ApiTags('Banco')
@UseGuards(AuthGuard('jwt'))
@Controller('bancos')
@ApiBearerAuth()
export class BancoController {
  constructor(private readonly bancoService: BancoService) {}

  @Get()
  obtenerTodos(@CurrentUser() usuario: Usuario) {
    return this.bancoService.obtenerTodosPorUsuario(usuario.id);
  }
}
