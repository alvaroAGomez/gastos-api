import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Bancos')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('banco')
export class BancoController {}
