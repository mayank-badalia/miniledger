// Tests for the input validation rules.

import { describe, it, expect } from "vitest";
import { phoneSchema, createLoanSchema } from "../src/validation";

describe("phone validation", () => {
  it("accepts a normal phone number", () => {
    expect(phoneSchema.safeParse("9876543210").success).toBe(true);
    expect(phoneSchema.safeParse("+919876543210").success).toBe(true);
  });

  it("rejects letters and too-short numbers", () => {
    expect(phoneSchema.safeParse("hello").success).toBe(false);
    expect(phoneSchema.safeParse("123").success).toBe(false);
  });
});

describe("create-loan validation", () => {
  it("accepts a valid loan", () => {
    const result = createLoanSchema.safeParse({
      friend_name: "Asha",
      amount: "500", // strings are coerced to numbers
      due_date: "2026-12-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero or negative amount", () => {
    expect(
      createLoanSchema.safeParse({ friend_name: "Asha", amount: "0", due_date: "2026-12-01" }).success
    ).toBe(false);
    expect(
      createLoanSchema.safeParse({ friend_name: "Asha", amount: "-5", due_date: "2026-12-01" }).success
    ).toBe(false);
  });

  it("rejects a missing friend name", () => {
    expect(
      createLoanSchema.safeParse({ friend_name: "", amount: "10", due_date: "2026-12-01" }).success
    ).toBe(false);
  });
});
