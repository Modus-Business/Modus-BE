import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
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

  @OneToMany(
    () => ClassParticipant,
    (classParticipant) => classParticipant.classroom,
  )
  classParticipants!: ClassParticipant[];

  @OneToMany(() => Group, (group) => group.classroom)
  groups!: Group[];
}
