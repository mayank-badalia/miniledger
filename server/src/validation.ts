// Input validation lives in one place using Zod.
// Zod checks the shape of incoming data and gives friendly error messages.
// Keeping these schemas here (not scattered in routes) makes them easy to
// read and to unit-test.

import { z } from "zod";

// A phone number: digits, optional leading "+", 7 to 15 digits long.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{7,15}$/, "Enter a valid phone number (7–15 digits).");

// The 6-digit OTP code we send back during login.
export const otpSchema = z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits.");

// Body for "request an OTP".
export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

// Body for "verify the OTP and log in".
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: otpSchema,
});

// Body for "add a loan entry".
// Note: amount comes in as a number; due_date as an ISO date string.
export const createLoanSchema = z.object({
  friend_name: z.string().trim().min(1, "Friend name is required.").max(80),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number." })
    .positive("Amount must be greater than 0."),
  due_date: z.coerce.date({ invalid_type_error: "Enter a valid due date." }),
});

// TypeScript types inferred from the schemas above (so we don't repeat ourselves).
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
