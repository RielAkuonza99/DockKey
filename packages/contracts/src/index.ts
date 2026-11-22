export type GeneratorAction = "send" | "verify";
export interface GeneratorRequest { email: string }
export type VerificationStatus = "accepted" | "pending" | "completed";
export interface GeneratorResponse {
  success: boolean;
  status: VerificationStatus;
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
