import { Controller, UseGuards } from '@nestjs/common';
import { CuotaService } from './cuota.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Cuota')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('Cuota')
export class CuotaController {
  constructor(private readonly cuotaService: CuotaService) {}
}
