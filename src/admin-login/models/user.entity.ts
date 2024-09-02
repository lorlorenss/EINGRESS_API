import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}

@Entity()
export class _dbadmin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
  role: UserRole;

  @Column({ unique: true, nullable: true})
  email: string;

  @Column({ default: false, nullable: true })
  verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reset_token: string;

  @Column({ type: 'timestamp', nullable: true })
  token_expiry: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImage?: string;
}
