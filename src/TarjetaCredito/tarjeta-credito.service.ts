import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarjetaCredito } from './tarjeta-credito.entity';
import { CreateTarjetaCreditoDto } from './dto/create-tarjeta-credito.dto';
import { Usuario } from 'src/Usuario/usuario.entity';
import { Banco } from 'src/Banco/banco.entity';
import { UpdateTarjetaCreditoDto } from './dto/update-tarjeta-credito.dto';

@Injectable()
export class TarjetaCreditoService {
  constructor(
    @InjectRepository(TarjetaCredito)
    private readonly tarjetaRepo: Repository<TarjetaCredito>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Banco)
    private readonly bancoRepo: Repository<Banco>
  ) {}

  async crear(dto: CreateTarjetaCreditoDto, usuario: Usuario): Promise<TarjetaCredito> {
    const banco = await this.bancoRepo.findOneBy({ id: dto.bancoId });

    if (!usuario || !banco) throw new NotFoundException('Usuario o banco no encontrado');

    const tarjeta = this.tarjetaRepo.create({
      ...dto,
      cierreCiclo: new Date(dto.cierreCiclo),
      fechaVencimiento: new Date(dto.fechaVencimiento),
      usuario,
      banco,
    });
    console.log('tarjeta', tarjeta);

    return this.tarjetaRepo.save(tarjeta);
  }

  async listarPorUsuario(usuarioId: number): Promise<TarjetaCredito[]> {
    return this.tarjetaRepo.find({
      where: {
        usuario: { id: usuarioId },
        deletedAt: null,
      },
      relations: ['banco'],
      order: { nombreTarjeta: 'ASC' },
    });
  }

  async actualizar(id: number, dto: UpdateTarjetaCreditoDto, usuarioId: number): Promise<TarjetaCredito> {
    const tarjeta = await this.tarjetaRepo.findOne({
      where: { id, usuario: { id: usuarioId }, deletedAt: null },
      relations: ['usuario', 'banco'],
    });

    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');

    Object.assign(tarjeta, {
      ...dto,
      cierreCiclo: dto.cierreCiclo ? new Date(dto.cierreCiclo) : tarjeta.cierreCiclo,
      fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : tarjeta.fechaVencimiento,
    });

    return this.tarjetaRepo.save(tarjeta);
  }

  async eliminar(id: number, usuarioId: number): Promise<void> {
    const tarjeta = await this.tarjetaRepo.findOne({
      where: { id, usuario: { id: usuarioId }, deletedAt: null },
    });

    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');

    await this.tarjetaRepo.softRemove(tarjeta);
  }
}
