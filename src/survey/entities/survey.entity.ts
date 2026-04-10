import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/signup/entities/user.entity';

@Entity({ name: 'surveys' })
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  surveyId!: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  mbti!: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  personality!: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  preference!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
