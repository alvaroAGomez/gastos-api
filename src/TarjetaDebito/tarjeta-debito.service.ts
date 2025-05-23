import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarjetaDebito } from './tarjeta-debito.entity';
import { CreateTarjetaDebitoDto } from './dto/create-tarjeta-debito.dto';
import { Usuario } from '../Usuario/usuario.entity';
import { Banco } from '../Banco/banco.entity';
import { TarjetaDebitoResponseDto } from './dto/tarjeta-debito-response.dto';
import { UpdateTarjetaDebitoDto } from './dto/update-tarjeta-debito.dto';

@Injectable()
export class TarjetaDebitoService {
  constructor(
    @InjectRepository(TarjetaDebito)
    private tarjetaDebitoRepository: Repository<TarjetaDebito>,

    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,

    @InjectRepository(Banco)
    private bancoRepository: Repository<Banco>
  ) {}

  async crear(dto: CreateTarjetaDebitoDto, usuario: Usuario): Promise<TarjetaDebitoResponseDto> {
    const banco = await this.bancoRepository.findOneBy({ id: dto.bancoId });

    if (!usuario || !banco) {
      throw new NotFoundException('Usuario o banco no encontrado');
    }

    const tarjeta = this.tarjetaDebitoRepository.create({
      ...dto,
      usuario,
      banco,
    });

    const guardada = await this.tarjetaDebitoRepository.save(tarjeta);

    return this.toResponseDto(guardada);
  }

  async obtenerTodas(): Promise<TarjetaDebitoResponseDto[]> {
    const tarjetas = await this.tarjetaDebitoRepository.find({
      relations: ['banco'],
      where: { deletedAt: null },
    });

    return tarjetas.map(this.toResponseDto);
  }

  async actualizar(id: number, dto: UpdateTarjetaDebitoDto): Promise<TarjetaDebitoResponseDto> {
    const tarjeta = await this.tarjetaDebitoRepository.findOne({
      where: { id },
      relations: ['banco'],
    });

    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');

    if (dto.bancoId) {
      const banco = await this.bancoRepository.findOneBy({ id: dto.bancoId });
      if (!banco) throw new NotFoundException('Banco no encontrado');
      tarjeta.banco = banco;
    }

    Object.assign(tarjeta, dto);
    const actualizada = await this.tarjetaDebitoRepository.save(tarjeta);

    return this.toResponseDto(actualizada);
  }

  async eliminar(id: number): Promise<void> {
    const tarjeta = await this.tarjetaDebitoRepository.findOneBy({ id });
    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');
    await this.tarjetaDebitoRepository.softDelete(id);
  }

  private toResponseDto = (tarjeta: TarjetaDebito): TarjetaDebitoResponseDto => ({
    id: tarjeta.id,
    nombreTarjeta: tarjeta.nombreTarjeta,
    numeroTarjeta: tarjeta.numeroTarjeta,
    saldoDisponible: tarjeta.saldoDisponible,
    banco: {
      id: tarjeta.banco.id,
      nombre: tarjeta.banco.nombre,
    },
  });
}
