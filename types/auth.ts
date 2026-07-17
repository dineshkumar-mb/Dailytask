import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ResetPasswordSchema = z.object({
  code: z.string().min(6, 'Please enter the 6-digit code'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
