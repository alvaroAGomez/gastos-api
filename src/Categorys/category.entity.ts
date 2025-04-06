import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, DeleteDateColumn } from 'typeorm';
import { User } from 'src/users/user.entity';
import { Expense } from 'src/Expenses/expenses.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  icon: string;

  @ManyToOne(() => User, (user) => user.categories, { nullable: true, onDelete: 'CASCADE' })
  user: User | null;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
