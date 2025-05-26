import { CategoriaGasto } from 'src/Categoria/categoria.entity';
import { Cuota } from 'src/Cuota/cuota.entity';
import { TarjetaCredito } from 'src/TarjetaCredito/tarjeta-credito.entity';
import { TarjetaDebito } from 'src/TarjetaDebito/tarjeta-debito.entity';
import { Usuario } from 'src/Usuario/usuario.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, DeleteDateColumn } from 'typeorm';

@Entity('gasto')
export class Gasto {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TarjetaCredito, (tarjeta) => tarjeta.gastos, { nullable: true })
  tarjetaCredito: TarjetaCredito;

  @ManyToOne(() => TarjetaDebito, (tarjeta) => tarjeta.gastos, { nullable: true })
  tarjetaDebito: TarjetaDebito;

  @ManyToOne(() => Usuario, (usuario) => usuario.gastos)
  usuario: Usuario;

  @ManyToOne(() => CategoriaGasto, (categoria) => categoria.gastos)
  categoria: CategoriaGasto;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ length: 255 })
  descripcion: string;

  @Column()
  esEnCuotas: boolean;

  @Column({ default: 0 })
  totalCuotas: number;

  @OneToMany(() => Cuota, (cuota) => cuota.gasto)
  cuotas: Cuota[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
