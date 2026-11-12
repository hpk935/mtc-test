// The storefront owns the cart clock: every cart write sets `expiresAt`. We
// only read it; "expired" is never stored, it is derived here.

export const WEB_CART_STATUSES = ['active', 'expired', 'completed'] as const;
export type WebCartStatus = (typeof WEB_CART_STATUSES)[number];

export const WEB_CART_STATUS_LABEL: Record<WebCartStatus, string> = {
    active: 'Active',
    expired: 'Expired',
    completed: 'Completed',
};

export function cartDisplayStatus(
    cart: { status: string; expiresAt: Date | string },
    now: Date,
): WebCartStatus {
    if (cart.status === 'completed') return 'completed';
    return new Date(cart.expiresAt) <= now ? 'expired' : 'active';
}
