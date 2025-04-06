import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Card } from 'src/Cards/cards.entity';
import { Category } from 'src/Categorys/category.entity';

@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn()
  date: Date;

  @Column()
  description: string;

  @Column({ nullable: true })
  installments?: number;

  @Column({ nullable: true })
  remainingInstallments?: number;

  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Category, (category) => category.expenses, {
    eager: true,
    nullable: true,
  })
  category: Category;

  @ManyToOne(() => Card, (card) => card.expenses, { nullable: true })
  card: Card;
}
