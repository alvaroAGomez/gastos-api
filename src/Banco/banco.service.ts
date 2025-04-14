import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banco } from './banco.entity';
import { CreateBancoDto } from './dto/create-banco.dto';
import { UpdateBancoDto } from './dto/update-banco.dto';
import { Usuario } from 'src/usuario/usuario.entity';
import { BancoResponseDto } from './dto/banco-response.dto';

@Injectable()
export class BancoService {
  constructor(
    @InjectRepository(Banco)
    private readonly bancoRepository: Repository<Banco>
  ) {}

  async crear(createBancoDto: CreateBancoDto, usuario: Usuario): Promise<Banco> {
    const banco = this.bancoRepository.create({
      nombre: createBancoDto.nombre,
      usuario,
    });

    return this.bancoRepository.save(banco);
  }

  async obtenerTodosPorUsuario(usuarioId: number): Promise<BancoResponseDto[]> {
    const bancos = await this.bancoRepository
      .createQueryBuilder('banco')
      .leftJoinAndSelect('banco.usuario', 'usuario')
      .where('(usuario.id = :usuarioId OR banco.usuario IS NULL)', { usuarioId: usuarioId })
      .getMany();

    return bancos.map((b) => ({
      id: b.id,
      nombre: b.nombre,
      pais: b.pais,
      usuarioId: b.usuario ? b.usuario.id : null,
    }));
  }

  async obtenerPorId(id: number, usuarioId: number): Promise<Banco> {
    const banco = await this.bancoRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!banco || banco.usuario.id !== usuarioId) {
      throw new NotFoundException('Banco no encontrado');
    }

    return banco;
  }

  async actualizar(id: number, updateBancoDto: UpdateBancoDto, usuarioId: number): Promise<Banco> {
    const banco = await this.obtenerPorId(id, usuarioId);
    banco.nombre = updateBancoDto.nombre;
    return this.bancoRepository.save(banco);
  }

  async eliminar(id: number, usuarioId: number): Promise<void> {
    const banco = await this.obtenerPorId(id, usuarioId);
    await this.bancoRepository.remove(banco);
  }
}
