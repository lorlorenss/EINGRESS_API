import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class _dblogstotal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true,type: 'date', default: () => 'CURRENT_DATE' })
  date?: Date;  


  @Column()
  loginstoday?: string;
  
  @Column()
  notlogin?: string;   
  
}
