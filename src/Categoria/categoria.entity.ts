import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from '../Usuario/usuario.entity';
import { Gasto } from '../Gasto/gasto.entity';

@Entity('categoria')
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column()
  es_global: boolean;

  @Column({ name: 'usuario_id', nullable: true })
  usuario_id: number;

  @Column({ length: 7, nullable: true })
  color_hex: string;

  @Column({ length: 100, nullable: true })
  icono: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.categorias)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @OneToMany(() => Gasto, (gasto) => gasto.categoria)
  gastos: Gasto[];
}
