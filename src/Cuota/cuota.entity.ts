import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Gasto } from '../Gasto/gasto.entity';
import { EstadoCuenta } from '../EstadoCuenta/estado-cuenta.entity';

@Entity('cuota')
export class Cuota {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'gasto_id' })
  gasto_id: number;

  @Column({ name: 'estado_id' })
  estado_id: number;

  @Column()
  numero: number;

  @Column({ type: 'date' })
  fecha_cuota: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  monto_cuota: number;

  @Column({ length: 3 })
  moneda: string;

  @ManyToOne(() => Gasto, (gasto) => gasto.cuotas)
  @JoinColumn({ name: 'gasto_id' })
  gasto: Gasto;

  @ManyToOne(() => EstadoCuenta)
  @JoinColumn({ name: 'estado_id' })
  estado: EstadoCuenta;
}
