import { Card } from 'src/Cards/cards.entity';
import { Category } from 'src/Categorys/category.entity';
import { Expense } from 'src/Expenses/expenses.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Card, (card) => card.user)
  cards: Card[];

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];
}
