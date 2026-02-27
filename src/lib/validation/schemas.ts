import { z } from 'zod';

export const travelerInfoSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
});

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
  subject: z.string().min(1, 'Required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  marketingConsent: z.boolean().optional(),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

// E.164: + and 7–15 digits
const e164Regex = /^\+[1-9]\d{6,14}$/;

// ─── Account ─────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().max(100).optional(),
  phone: z.string().min(1, 'Phone is required').regex(e164Regex, 'Invalid phone number'),
  newsletter: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const profileSchema = z.object({
  name: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  phone: z.string().min(1, 'Phone is required').regex(e164Regex, 'Invalid phone number'),
  newsletter: z.boolean().optional(),
});

export type TravelerInfoForm = z.infer<typeof travelerInfoSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type NewsletterFormData = z.infer<typeof newsletterSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
