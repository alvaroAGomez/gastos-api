import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { Usuario } from '../Usuario/usuario.entity';
import { TarjetaCredito } from '../TarjetaCredito/tarjeta-credito.entity';
import { Categoria } from '../Categoria/categoria.entity';
import { Cuota } from '../Cuota/cuota.entity';
import { EstadoCuenta } from '../EstadoCuenta/estado-cuenta.entity';
import { DebitoConfig } from 'src/DebitoConfig/debito-config.entity';

@Entity('gasto')
@Index('uq_gasto_debito_periodo', ['debito_config_id', 'periodo_mes'], { unique: true })
export class Gasto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuario_id: number;

  @Column({ name: 'tarjeta_id' })
  tarjeta_id: number;

  @Column({ name: 'categoria_id' })
  categoria_id: number;

  @Column({ name: 'estado_id' })
  estado_id: number;

  @Column({ length: 200 })
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column({ length: 3 })
  moneda: string;

  @Column({ type: 'date' })
  fecha_compra: Date;

  @Column({ type: 'boolean' })
  es_debito_auto: boolean;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => TarjetaCredito)
  @JoinColumn({ name: 'tarjeta_id' })
  tarjeta: TarjetaCredito;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @ManyToOne(() => EstadoCuenta)
  @JoinColumn({ name: 'estado_id' })
  estado: EstadoCuenta;

  @OneToMany(() => Cuota, (cuota) => cuota.gasto)
  cuotas: Cuota[];

  @Column({ type: 'bigint', unsigned: true, name: 'debito_config_id', nullable: true })
  debito_config_id: number | null;

  @ManyToOne(() => DebitoConfig)
  @JoinColumn({ name: 'debito_config_id' })
  debitoConfig: DebitoConfig;

  // Columna generada en MySQL (opcional pero recomendado). Si tu DB ya la tiene, dejalo.
  @Column({
    type: 'char',
    length: 7,
    name: 'periodo_mes',
    asExpression: "DATE_FORMAT(`fecha_compra`, '%Y-%m')",
    generatedType: 'STORED',
  })
  periodo_mes: string;
}
