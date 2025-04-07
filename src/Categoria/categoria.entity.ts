import { Gasto } from 'src/Gasto/gasto.entity';
import { Usuario } from 'src/Usuario/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, DeleteDateColumn } from 'typeorm';

@Entity('CategoriaGasto')
export class CategoriaGasto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  nombre: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.categorias, { nullable: true })
  usuario: Usuario;

  @OneToMany(() => Gasto, (gasto) => gasto.categoria)
  gastos: Gasto[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
