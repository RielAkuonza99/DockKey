export type GeneratorAction = "send" | "verify";
export interface GeneratorRequest { email: string }
export interface GeneratorResponse {
  success: boolean;
  email: string;
  message: string;
  verificationUrl?: string;
  oobCode?: string;
}
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}
