import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'nickname_reservations' })
@Unique('uq_nickname_reservations_nickname', ['nickname'])
export class NicknameReservation {
  @PrimaryGeneratedColumn('uuid')
  nicknameReservationId!: string;

  @Column({ type: 'varchar', length: 100 })
  nickname!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
