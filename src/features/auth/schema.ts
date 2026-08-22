import { z } from 'zod';

/**
 * Password rules.
 *
 * Length is the requirement that actually matters, so the minimum is 12 rather
 * than an eight-character rule with symbol theatre. We reject the handful of
 * patterns that defeat length (all one character, obvious sequences) and leave
 * the rest to the user.
 */
const OBVIOUS = /^(?:(.)\1+|0123456789\d*|1234567890\d*|(?:password|qwerty|bdoor)\w*)$/i;

export const passwordSchema = z
  .string()
  .min(12, 'passwordTooShort')
  .max(200, 'passwordTooLong')
  .refine((value) => !OBVIOUS.test(value.trim()), 'passwordTooObvious');

export const emailSchema = z.string().trim().toLowerCase().email('invalidEmail').max(254);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'passwordRequired').max(200),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, 'nameTooShort').max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: 'termsRequired' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export const resetRequestSchema = z.object({ email: emailSchema });

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export const mfaCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'invalidCode'),
});

export const organizationSchema = z.object({
  name: z.string().trim().min(2, 'orgNameTooShort').max(200),
  country: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase()),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
});

export const inviteSchema = z.object({
  email: emailSchema,
  role: z.enum(['customer_owner', 'customer_member', 'partner_owner', 'partner_staff']),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
