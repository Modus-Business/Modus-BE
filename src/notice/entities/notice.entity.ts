import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Classroom } from '../../class/entities/class.entity';

@Entity({ name: 'notices' })
export class Notice {
  @PrimaryGeneratedColumn('uuid')
  noticeId!: string;

  @Column({ type: 'uuid', name: 'class_id' })
  classId!: string;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'varchar', length: 2000 })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Classroom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  classroom!: Classroom;
}
