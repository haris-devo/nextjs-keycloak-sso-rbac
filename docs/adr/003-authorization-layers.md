# ADR 003: Enforce roles at the data boundary

Status: accepted.

The route guard uses `proxy.ts`, the name used by Next.js 16. It checks path segments, handles login, expiration, and denied responses, and preserves Auth.js cookie updates. It is the requested middleware layer under the current framework convention.

Protected server pages call `requirePageRole`, which calls the shared typed `requireRole`. The API response helper also calls `requireRole`. A layout and a hidden navigation link cannot secure a page, server action, or route handler on their own. Page checks must stay in the pages when features are added, and every future mutation must have its own server-side policy.

UI gating makes navigation easier. It is not a security boundary. Page permission denial is rendered using `/403`; the guard returns HTTP 403 for a denied protected URL. The fallback page helper redirects to `/403` if reached without a guard, still preventing protected content from rendering.
