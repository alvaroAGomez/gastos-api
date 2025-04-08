import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Banco } from '../Banco/banco.entity';
import { Gasto } from 'src/Gasto/gasto.entity';
import { Usuario } from 'src/Usuario/usuario.entity';

@Entity('TarjetaCredito')
export class TarjetaCredito {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.tarjetasCredito)
  usuario: Usuario;

  @ManyToOne(() => Banco, (banco) => banco.tarjetasCredito)
  banco: Banco;

  @Column({ length: 16, unique: true })
  numeroTarjeta: string;

  @Column({ length: 50 })
  nombreTarjeta: string;

  @Column('decimal', { precision: 10, scale: 2 })
  limiteCredito: number;

  @Column({ type: 'date' })
  cierreCiclo: Date;

  @Column({ type: 'date' })
  fechaVencimiento: Date;

  @OneToMany(() => Gasto, (gasto) => gasto.tarjetaCredito)
  gastos: Gasto[];
}
