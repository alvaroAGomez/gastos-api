import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Usuario } from '../Usuario/usuario.entity';
import { TarjetaCredito } from '../TarjetaCredito/tarjeta-credito.entity';

@Entity('banco')
export class Banco {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 200, nullable: true })
  logo_url: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.bancos)
  usuario: Usuario;

  @OneToMany(() => TarjetaCredito, (tarjeta) => tarjeta.banco)
  tarjetas: TarjetaCredito[];
}
