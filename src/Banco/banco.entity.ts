import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { TarjetaDebito } from 'src/TarjetaDebito/tarjeta-debito.entity';
import { Usuario } from 'src/Usuario/usuario.entity';

@Entity('banco')
export class Banco {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 50 })
  pais: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.bancos, { eager: false })
  usuario: Usuario;

  @OneToMany(() => TarjetaCredito, (tarjeta) => tarjeta.banco)
  tarjetasCredito: TarjetaCredito[];

  @OneToMany(() => TarjetaDebito, (tarjeta) => tarjeta.banco)
  tarjetasDebito: TarjetaDebito[];
}
