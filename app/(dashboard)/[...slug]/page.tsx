import { notFound } from 'next/navigation';

// Catches URLs that match no route so they get the in-app 404 (with the
// sidebar) instead of the bare root one. Auth is enforced by `proxy.ts`.
export default function UnknownRoutePage() {
  notFound();
}
