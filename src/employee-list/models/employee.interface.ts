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
  fingerprintfile1?: Buffer;
  fingerprintfile2?: Buffer;
  fingerprintFile1Name?: string; 
  fingerprintFile2Name?: string;
  rfidtag?: string;
  branch: string;
  deldate?:Date;
}