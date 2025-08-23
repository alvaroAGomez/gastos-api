import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Usuario } from '../Usuario/usuario.entity';
import { Banco } from '../Banco/banco.entity';
import { Gasto } from '../Gasto/gasto.entity';
import { DebitoConfig } from '../DebitoConfig/debito-config.entity';

@Entity('tarjeta_credito')
export class TarjetaCredito {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.tarjetasCredito)
  usuario: Usuario;

  @ManyToOne(() => Banco, (banco) => banco.tarjetas)
  banco: Banco;

  @Column('decimal', { precision: 10, scale: 2 })
  limite_total: number;

  @Column({ type: 'int' })
  dia_cierre_default: number;

  @Column({ type: 'int' })
  dia_vencimiento_default: number;

  @OneToMany(() => DebitoConfig, (config) => config.tarjeta)
  debitoConfigs: DebitoConfig[];

  @OneToMany(() => Gasto, (gasto) => gasto.tarjeta)
  gastos: Gasto[];

  @Column({ length: 4, nullable: true })
  ultimos4Digitos: string;
}
