import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/sante/route";

describe("GET /api/sante", () => {
  it("returns 200 with { statut: 'ok' } when the DB is reachable", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ statut: "ok" });
    expect(typeof body.baseDeDonnees).toBe("boolean");
  });
});
