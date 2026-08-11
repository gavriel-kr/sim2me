import { z } from 'zod';

/**
 * Ticket 037. Messages are codes, not sentences: this form renders in Hebrew, English and Arabic, and
 * a zod message goes straight to the screen. `CheckoutClient` maps each code to a translated string.
 *
 * `consent` is the purchase-time acceptance of the terms and of immediate delivery. It is enforced again
 * in `api/checkout/create-transaction` — this schema is the convenience for humans, not the control.
 */
export const travelerInfoSchema = z.object({
  email: z.string().email('invalidEmail'),
  firstName: z.string().min(1, 'required'),
  lastName: z.string().min(1, 'required'),
  consent: z.boolean().refine((v) => v === true, { message: 'consentRequired' }),
});

export const CONTACT_SUBJECTS = [
  'Installation Help',
  'Activation Issue',
  'Connectivity Problem',
  'Refund Request',
  'Billing & Payment',
  'General Inquiry',
] as const;

export type ContactSubject = typeof CONTACT_SUBJECTS[number];

/*
  Upper bounds are as much a part of validation as the lower ones: the message column is `Text`, the
  form is public, and nothing else between the request and the database says how big a submission may
  be. The ceilings are far above anything a person types.
*/
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Required').max(100, 'Name is too long'),
  email: z.string().email().max(254),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Invalid phone number'),
  subject: z.enum(CONTACT_SUBJECTS),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
  marketingConsent: z.boolean().optional(),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

// E.164: + and 7–15 digits
const e164Regex = /^\+[1-9]\d{6,14}$/;

// Shared password strength rule used across register / reset / change-password
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ─── Account ─────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: passwordSchema,
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
  password: passwordSchema,
});

export const profileSchema = z.object({
  name: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  phone: z.string().min(1, 'Phone is required').regex(e164Regex, 'Invalid phone number'),
  newsletter: z.boolean().optional(),
});

// ─── Admin: internal eSIM sale ───────────────────────────────
// Either customerId (picked from an existing account) or email is required.
// name + phone are only needed when the email has no account yet — the route
// answers CUSTOMER_NOT_FOUND so the modal can ask for them.
export const internalSaleSchema = z.object({
  idempotencyKey: z.string().uuid(),
  packageCode: z.string().min(1).max(128),
  customerId: z.string().min(1).max(64).optional(),
  email: z.string().email('Valid email is required').optional(),
  name: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().regex(e164Regex, 'Invalid phone number').optional(),
  priceToCustomer: z.number().nonnegative('Price cannot be negative').max(100000),
  paymentNote: z.string().max(500).optional(),
  emailLocale: z.enum(['he', 'en', 'ar']),
}).refine((d) => Boolean(d.customerId || d.email), {
  message: 'A customer id or an email is required',
  path: ['email'],
});

export type InternalSaleInput = z.infer<typeof internalSaleSchema>;

export type TravelerInfoForm = z.infer<typeof travelerInfoSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type NewsletterFormData = z.infer<typeof newsletterSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
