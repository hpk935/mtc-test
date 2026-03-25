// Auth helpers — session management and guards
// TODO: Implement when auth approach is chosen (Auth.js v5 or custom sessions)

/**
 * Get the current user session. Returns null if not authenticated.
 * Call from Server Components or Server Actions.
 */
export async function getSession() {
  // TODO: implement
  return null;
}

/**
 * Require authentication. Throws/redirects if no valid session.
 * Call from Server Actions before performing mutations.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
