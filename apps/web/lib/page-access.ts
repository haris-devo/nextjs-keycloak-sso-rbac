// apps/web/lib/page-access.ts
import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccessError, requireRole, type Role } from "./rbac";

export async function requirePageRole(allowed: readonly Role[] = []) {
  try {
    return requireRole(await auth(), allowed);
  } catch (error) {
    if (!(error instanceof AccessError)) throw error;
    if (error.code === "SessionExpired") redirect("/session-expired");
    if (error.status === 403) redirect("/403");
    redirect("/login");
  }
}
