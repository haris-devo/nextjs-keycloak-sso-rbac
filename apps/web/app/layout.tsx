// apps/web/app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SSO Workspace", template: "%s | SSO Workspace" },
  description: "A Next.js and Keycloak example with server-enforced role access.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className="font-sans antialiased">
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-4">Skip to content</a>
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="font-semibold tracking-tight">SSO Workspace<span className="ml-2 text-xs font-normal text-muted-foreground">/ demo</span></Link>
        <Link href="/dashboard" prefetch={false} className="text-sm text-muted-foreground hover:text-foreground">Open workspace</Link>
      </div>
    </div>
    <main id="main" className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">{children}</main>
    <footer className="mx-auto max-w-5xl px-5 pb-8 text-xs text-muted-foreground sm:px-8">Next.js / Keycloak / OpenID Connect</footer>
  </body></html>;
}
