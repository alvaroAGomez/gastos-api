import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { TarjetaCredito } from '../TarjetaCredito/tarjeta-credito.entity';

@Entity('estado_cuenta')
export class EstadoCuenta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tarjeta_id' })
  tarjeta_id: number;

  @Column({ type: 'date' })
  fecha_cierre: Date;

  @Column({ type: 'date' })
  fecha_vencimiento: Date;

  @Column({ type: 'date' })
  inicio_periodo: Date;

  @Column({ type: 'date' })
  fin_periodo: Date;

  @Column({ length: 20 })
  estado: string;

  @ManyToOne(() => TarjetaCredito)
  tarjeta: TarjetaCredito;
}
