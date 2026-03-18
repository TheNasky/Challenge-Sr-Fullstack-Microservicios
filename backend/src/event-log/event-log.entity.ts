import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'event_log' })
export class EventLog {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar', length: 200 })
  public type!: string;

  @Column({ type: 'jsonb' })
  public payload!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp' })
  public createdAt!: Date;
}

