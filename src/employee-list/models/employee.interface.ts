export interface Employee {
  id?: number;
  fullname?: string;  
  phone?: string;
  email?: string;  
  role?: string;
  regdate?: Date;
  lastlogdate?: string;
  profileImage?: string;
  fingerprint1?: string;
  fingerprint2?: string;
  template1?: string;
  template2?: string;
  rfidtag?: string;
  branch: string;
  deldate?:Date;
}