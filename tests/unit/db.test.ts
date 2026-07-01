import { describe, it, expect } from "vitest";

describe("prisma client", () => {
  it("imports the singleton without throwing", async () => {
    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
  });
});
