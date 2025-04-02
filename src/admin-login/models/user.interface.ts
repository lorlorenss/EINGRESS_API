import { UserRole } from "./user.entity";

export interface User {
    id?: number;
    username?: string;  
    password?:string;
    role?: UserRole;
    email: string;
    verified: boolean;
    verify_otp: string;
    verify_expiry: Date;
    otp_code?: string; 
    otp_expiry?: Date;
    profileImage?: string;
    lastEmailChange?: Date;
    bday?: string;
    number?: string;
    age?: string;
    address?: string;
    gender?: string;
  }