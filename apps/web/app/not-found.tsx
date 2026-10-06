// apps/web/app/not-found.tsx
import Link from "next/link";
export default function NotFound() {
  return <div><h1 className="text-3xl font-semibold">Page not found</h1><Link href="/" className="mt-5 inline-block underline">Return home</Link></div>;
}
