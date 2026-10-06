// apps/web/app/api/admin/stats/route.ts
import { auth } from "@/auth";
import { adminStats } from "@/lib/admin-stats";

export const GET = auth((request) => adminStats(request.auth));
export const runtime = "nodejs";
