import { UserRole } from "./user.entity";

export interface User {
    id?: number;
    username?: string;  
    password?:string;
    role?: UserRole;
    email: string;
    verified: boolean;
    verify_token: string;
    token_expiry: Date;
    otp_code?: string; 
    otp_expiry?: Date;
    profileImage?: string;
  }