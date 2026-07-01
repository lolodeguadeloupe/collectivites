import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("hashes a password to a non-empty string different from the input", async () => {
    const hash = await hashPassword("MotDePasse123!");
    expect(hash).toBeTypeOf("string");
    expect(hash.length).toBeGreaterThan(20);
    expect(hash).not.toBe("MotDePasse123!");
  });

  it("verifies a matching password", async () => {
    const hash = await hashPassword("MotDePasse123!");
    await expect(verifyPassword("MotDePasse123!", hash)).resolves.toBe(true);
  });

  it("rejects a non-matching password", async () => {
    const hash = await hashPassword("MotDePasse123!");
    await expect(verifyPassword("MotDePasse456!", hash)).resolves.toBe(false);
  });
});
