import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { _dbaccesslog } from '../../access-log/models/access-log.entity'; // Import the AccessLog entity

@Entity()
export class _dbemployee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullname: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column()
  role: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  regdate: Date;  // Registration date (date only)

  // @Column()
  // regdate:string;

  @Column()
  lastlogdate: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  rfidtag: string;


  // This should be unique kay mao ang naa sa database
  @Column({ nullable: true})
  fingerprint1: string;
  @Column({ nullable: true})
  fingerprint2: string;
  @Column({ nullable: true})
  template1: string;
  @Column({ nullable: true})
  template2: string;
  @Column({ nullable: true})
  branch: string;

  @Column({ type: 'date',  nullable: true})
  deldate: Date;


  @OneToMany(() => _dbaccesslog, (accessLog) => accessLog.employee)
  accessLogs: _dbaccesslog[]; // One-to-many relationship with AccessLog

  
}
