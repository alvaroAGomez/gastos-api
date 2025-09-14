import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { TarjetaCredito } from '../TarjetaCredito/tarjeta-credito.entity';
import { Categoria } from '../Categoria/categoria.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 256 })
  password: string;

  @CreateDateColumn({ name: 'fechaRegistro' })
  fechaRegistro: Date;

  @OneToMany(() => TarjetaCredito, (tarjeta) => tarjeta.usuario)
  tarjetasCredito: TarjetaCredito[];

  @OneToMany(() => Categoria, (categoria) => categoria.usuario)
  categorias: Categoria[];
}
