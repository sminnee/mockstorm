import { describe, expect, it } from "vitest";
import { app } from "./index";

describe("GET /", () => {
  it("returns status ok", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });
});
