import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from '../Usuario/usuario.entity';
import { TarjetaCredito } from '../TarjetaCredito/tarjeta-credito.entity';
import { Categoria } from '../Categoria/categoria.entity';

@Entity('debito_config')
export class DebitoConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuario_id: number;

  @Column({ name: 'tarjeta_id' })
  tarjeta_id: number;

  @Column({ name: 'categoria_id' })
  categoria_id: number;

  @Column({ length: 200 })
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column({ length: 3 })
  moneda: string;

  @Column({ type: 'date' })
  fecha_suscripcion: Date;

  @Column({ type: 'boolean' })
  activo: boolean;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  @ManyToOne(() => Usuario)
  usuario: Usuario;

  @ManyToOne(() => TarjetaCredito, (tarjeta) => tarjeta.debitoConfigs)
  tarjeta: TarjetaCredito;

  @ManyToOne(() => Categoria)
  categoria: Categoria;

  @Column({ type: 'enum', enum: ['mensual', 'bimestral', 'trimestral', 'semestral', 'anual'], default: 'mensual' })
  periodicidad: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
}
