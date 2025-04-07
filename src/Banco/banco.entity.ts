import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { TarjetaDebito } from 'src/TarjetaDebito/tarjeta-debito.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('Banco')
export class Banco {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 50 })
  pais: string;

  @OneToMany(() => TarjetaCredito, (tarjeta) => tarjeta.banco)
  tarjetasCredito: TarjetaCredito[];

  @OneToMany(() => TarjetaDebito, (tarjeta) => tarjeta.banco)
  tarjetasDebito: TarjetaDebito[];
}
