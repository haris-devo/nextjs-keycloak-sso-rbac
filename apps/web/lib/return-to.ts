// apps/web/lib/return-to.ts
const destinations = new Set(["/dashboard", "/editor", "/admin"]);
export function safeReturnTo(value: unknown): string {
  return typeof value === "string" && destinations.has(value) ? value : "/dashboard";
}
