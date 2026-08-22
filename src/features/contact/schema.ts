import { z } from 'zod';

export const CONTACT_TOPICS = [
  'general',
  'startBusiness',
  'foreign',
  'compliance',
  'partner',
  'other',
] as const;

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'nameTooShort').max(120, 'tooLong'),
  email: z.string().trim().toLowerCase().email('invalidEmail').max(254, 'tooLong'),
  phone: z.string().trim().max(32, 'tooLong').optional().or(z.literal('')),
  topic: z.enum(CONTACT_TOPICS),
  message: z.string().trim().min(10, 'messageTooShort').max(5000, 'tooLong'),
  consent: z.literal(true, { message: 'consentRequired' }),
  /** Honeypot: a real person never fills this in. */
  website: z.string().max(0, 'spam').optional().or(z.literal('')),
});

export type ContactInput = z.infer<typeof contactSchema>;
