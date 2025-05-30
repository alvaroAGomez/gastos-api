import { Gasto } from '../Gasto/gasto.entity';
import { TarjetaCredito } from '../TarjetaCredito/tarjeta-credito.entity';
import { TarjetaDebito } from '../TarjetaDebito/tarjeta-debito.entity';
import { CategoriaGasto } from '../Categoria/categoria.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Banco } from '../Banco/banco.entity';

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

  @OneToMany(() => TarjetaDebito, (tarjeta) => tarjeta.usuario)
  tarjetasDebito: TarjetaDebito[];

  @OneToMany(() => Gasto, (gasto) => gasto.usuario)
  gastos: Gasto[];

  @OneToMany(() => CategoriaGasto, (categoria) => categoria.usuario)
  categorias: CategoriaGasto[];

  @OneToMany(() => Banco, (banco) => banco.usuario)
  bancos: Banco[];
}
