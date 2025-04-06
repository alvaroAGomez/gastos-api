import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Expense } from 'src/Expenses/expenses.entity';

export type CardType = 'credito' | 'debito';

@Entity()
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['credito', 'debito'] })
  type: CardType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  creditLimit?: number;

  @Column({ nullable: true })
  closingDay?: number;

  @Column({ nullable: true })
  dueDay?: number;

  @ManyToOne(() => User, (user) => user.cards, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Expense, (expense) => expense.card)
  expenses: Expense[];
}
