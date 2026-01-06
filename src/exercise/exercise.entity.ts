import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { History } from '../history/history.entity';

@Entity()
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 10 })
  durationMinutes: number;

  @Column({ default: 0 })
  currentBpmRecord: number;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => History, (history) => history.exercise)
  history: History[];
}
