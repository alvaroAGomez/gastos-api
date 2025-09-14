import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TarjetaCredito } from '../TarjetaCredito/tarjeta-credito.entity';

@Entity('banco')
export class Banco {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 200, nullable: true })
  logo_url: string;

  @OneToMany(() => TarjetaCredito, (tarjeta) => tarjeta.banco)
  tarjetas: TarjetaCredito[];
}
