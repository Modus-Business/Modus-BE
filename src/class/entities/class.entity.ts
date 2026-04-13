import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/signup/entities/user.entity';
import { Group } from '../../group/entities/group.entity';
import { ClassParticipant } from './class-participant.entity';

@Entity({ name: 'classes' })
export class Classroom {
  @PrimaryGeneratedColumn('uuid')
  classId!: string;

  @Column({ type: 'uuid', name: 'teacher_id' })
  teacherId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 30, unique: true, name: 'class_code' })
  classCode!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher?: User;

  @OneToMany(
    () => ClassParticipant,
    (classParticipant) => classParticipant.classroom,
  )
  classParticipants!: ClassParticipant[];

  @OneToMany(() => Group, (group) => group.classroom)
  groups!: Group[];
}
