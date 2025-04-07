import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Banco } from '../Banco/banco.entity';
import { Gasto } from 'src/Gasto/gasto.entity';
import { Usuario } from 'src/Usuario/user.entity';

@Entity('TarjetaDebito')
export class TarjetaDebito {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.tarjetasDebito)
  usuario: Usuario;

  @ManyToOne(() => Banco, (banco) => banco.tarjetasDebito)
  banco: Banco;

  @Column({ length: 16, unique: true })
  numeroTarjeta: string;

  @Column({ length: 50 })
  nombreTarjeta: string;

  @Column('decimal', { precision: 10, scale: 2 })
  saldoDisponible: number;

  @OneToMany(() => Gasto, (gasto) => gasto.tarjetaDebito)
  gastos: Gasto[];
}
