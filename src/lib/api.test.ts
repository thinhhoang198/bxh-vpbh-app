import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSummary, UnauthorizedError } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("api", () => {
  it("maps HTTP 401 to UnauthorizedError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
    await expect(fetchSummary()).rejects.toBeInstanceOf(UnauthorizedError);
  });
  it("rejects payloads that break the contract", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ overall: [] }), { status: 200 })));
    await expect(fetchSummary()).rejects.toThrow();
  });
  it("rejects a full phone number in an entry", async () => {
    const { EntrySchema } = await import("./types");
    const bad = { rank: 1, name: "A", agency: "B", phoneMasked: "0797123333", guests: 1 };
    expect(EntrySchema.safeParse(bad).success).toBe(false);
  });
});
