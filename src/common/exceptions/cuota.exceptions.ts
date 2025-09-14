import { BadRequestException } from '@nestjs/common';

export class CuotaNotFoundException extends BadRequestException {
  constructor(numero: number) {
    super(`No hay estado de cuenta para la cuota #${numero}`);
  }
}

export class CuotaEstadoCerradoException extends BadRequestException {
  constructor(numero: number) {
    super(`La cuota #${numero} cae en un estado cerrado`);
  }
}

export class NoEstadoAbiertoException extends BadRequestException {
  constructor() {
    super('No hay estado abierto posterior disponible');
  }
}
