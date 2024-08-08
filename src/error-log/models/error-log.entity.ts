// src/error-log/entities/error-log.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class _dberrorLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  errorType: string;

  @Column()
  message: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}