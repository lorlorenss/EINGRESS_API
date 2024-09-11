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
  verify_otp: string;

  @Column({ type: 'timestamp', nullable: true })
  verify_expiry: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  otp_code: string;

  @Column({ type: 'timestamp', nullable: true })
  otp_expiry: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImage?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastEmailChange: Date;
}
