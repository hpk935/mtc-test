// Shared TypeScript types

/** Standard return type for Server Actions */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
