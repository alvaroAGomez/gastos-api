import { Gasto } from '../Gasto/gasto.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('cuota')
export class Cuota {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gastoId: number; // 👈 lo agregás explícitamente

  @ManyToOne(() => Gasto, (gasto) => gasto.cuotas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gastoId' }) // 👈 asegurás que el campo gastoId se use como FK
  gasto: Gasto;

  @Column()
  numeroCuota: number;

  @Column('decimal', { precision: 10, scale: 2 })
  montoCuota: number;

  @Column({ type: 'date' })
  fechaVencimiento: Date;

  @Column({ default: false })
  pagada: boolean;
}
