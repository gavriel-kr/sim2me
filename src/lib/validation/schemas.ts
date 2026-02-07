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
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

export type TravelerInfoForm = z.infer<typeof travelerInfoSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type NewsletterFormData = z.infer<typeof newsletterSchema>;
