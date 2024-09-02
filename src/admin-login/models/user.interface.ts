import { UserRole } from "./user.entity";

export interface User {
    id?: number;
    username?: string;  
    password?:string;
    role?: UserRole;
    email: string;
    verified: boolean;
    reset_token: string;
    token_expiry: Date;
    profileImage?: string;
  }