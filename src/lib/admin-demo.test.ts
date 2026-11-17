import { describe, expect, it } from "vitest";
import * as demo from "./admin-demo";
const { isDemoHost } = demo;

describe("demo admin preview", () => {
  it("is offered on the Lovable preview and local development", () => {
    expect(isDemoHost("id-preview--d20c1c95-9b70-43df-8328-4a3b66afab5d.lovable.app")).toBe(true);
    expect(isDemoHost("localhost")).toBe(true);
  });
  it("is never offered on the live site", () => {
    expect(isDemoHost("riloyd.in")).toBe(false);
    expect(isDemoHost("payment-main.vercel.app")).toBe(false);
    expect(isDemoHost("riloyd.lovable.app")).toBe(false);
  });
  it("ships no demo sign-in password", () => {
    expect("DEMO_ADMIN_PASSWORD" in demo).toBe(false);
    expect("isDemoLogin" in demo).toBe(false);
  });
});
