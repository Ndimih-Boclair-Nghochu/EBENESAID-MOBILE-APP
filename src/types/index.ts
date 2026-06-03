export type UserType =
  | 'student'
  | 'resident'
  | 'admin'
  | 'staff'
  | 'investor'
  | 'university'
  | 'agent'
  | 'job_partner'
  | 'supplier'
  | 'transport';

export interface SafeUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  university: string;
  countryOfOrigin: string;
  userType: UserType;
  avatar: string | null;
  isActive: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  hasPaid: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthLoginResponse {
  message: string;
  user: SafeUser;
  isFirstLogin: boolean;
  sessionToken?: string;
  session?: {
    token?: string;
    expiresAt?: string;
  };
}

export interface ApiError {
  error: string;
}

export interface AuthMeResponse {
  user: SafeUser;
}

export interface RegisterPayload {
  accountType: 'student' | 'resident';
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  university?: string;
  countryOfOrigin?: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

