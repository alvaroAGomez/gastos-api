import { PartialType } from '@nestjs/mapped-types';
import { CreateTarjetaCreditoDto } from './create-tarjeta-credito.dto';

export class UpdateTarjetaCreditoDto extends PartialType(CreateTarjetaCreditoDto) {}
