// apps/web/lib/env.ts
import "server-only";
import { z } from "zod";

function secureUrl(value: string) {
  try {
    const url = new URL(value);
    return !url.username && !url.password && !url.search && !url.hash &&
      (url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost"));
  } catch { return false; }
}
function hasPath(value: string, path: string) {
  try { return new URL(value).pathname === path; } catch { return false; }
}

const schema = z.object({
  AUTH_SECRET: z.string().min(32).refine((v) => !v.startsWith("replace-"), "Generate a random secret"),
  AUTH_URL: z.url().refine(secureUrl, "Use HTTPS, or HTTP localhost for development")
    .refine((v) => hasPath(v, "/"), "AUTH_URL must be an origin"),
  AUTH_KEYCLOAK_ID: z.literal("web"),
  AUTH_KEYCLOAK_SECRET: z.string().min(16).refine((v) => !v.startsWith("replace-"), "Set the imported client secret"),
  AUTH_KEYCLOAK_ISSUER: z.url().refine(secureUrl, "Use the public HTTPS issuer")
    .refine((v) => hasPath(v, "/realms/demo"), "Issuer must end with /realms/demo"),
});

export type Environment = z.infer<typeof schema>;
let validated: Environment | undefined;
export function getEnv(): Environment {
  if (validated) return validated;
  const result = schema.safeParse(process.env);
  if (!result.success) {
    // Report field names and messages only. Never include secret values.
    throw new Error(`Invalid authentication environment: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  validated = { ...result.data, AUTH_URL: new URL(result.data.AUTH_URL).origin };
  return validated;
}
