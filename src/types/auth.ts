export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface JWTPayload {
  email: string;
  role: 'seller';
  iat?: number;
  exp?: number;
} 