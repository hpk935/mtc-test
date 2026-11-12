import type { WebCartStatus } from './cart-status';

// MongoDB filters for the web store lists. Kept free of the driver so they can
// be checked without a database.

type Filter = Record<string, unknown>;

/** Case-insensitive "contains" match that treats the text literally. */
function contains(text: string) {
    return {
        $regex: text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
    };
}

const ORDER_SEARCH_FIELDS = [
    'orderNumber',
    'contactInfo.email',
    'shippingAddress.firstName',
    'shippingAddress.lastName',
];

/**
 * Web orders matching `search`: every word must appear in the order #, the
 * contact email, or the ship-to first or last name, so "jane doe" works.
 */
export function webOrderFilter({ search }: { search?: string }): Filter {
    const words = (search ?? '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return {};
    return {
        $and: words.map((word) => ({
            $or: ORDER_SEARCH_FIELDS.map((field) => ({
                [field]: contains(word),
            })),
        })),
    };
}

/**
 * Carts with at least one item, narrowed to one displayed status (see
 * `cartDisplayStatus`) and to customer emails containing `search`.
 */
export function webCartFilter(
    { status, search }: { status?: WebCartStatus; search?: string },
    now: Date,
): Filter {
    const filter: Filter = { 'lineItems.0': { $exists: true } };

    if (status === 'completed') {
        filter.status = 'completed';
    } else if (status) {
        filter.status = { $ne: 'completed' };
        filter.expiresAt = status === 'active' ? { $gt: now } : { $lte: now };
    }

    if (search) {
        filter['buyerIdentity.email'] = contains(search);
    }

    return filter;
}
