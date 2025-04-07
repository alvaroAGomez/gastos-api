import { Gasto } from 'src/Gasto/gasto.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('Cuota')
export class Cuota {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Gasto, (gasto) => gasto.cuotas)
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
