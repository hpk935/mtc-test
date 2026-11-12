import type { WebCartStatus } from './cart-status';

// Web store records as the pages see them: read from the storefront's MongoDB
// (see lib/mongo.ts) and flattened to plain, serializable values.

export type WebOrderItem = {
    name: string;
    sku: string;
    upc?: string;
    /** In cases. */
    quantity: number;
    /** Price per case. */
    amountPerQuantity: string;
    totalAmount: string;
    /** Pieces per case. */
    casePack?: string;
    imageUrl?: string;
};

export type WebOrderAddress = {
    firstName: string;
    lastName: string;
    streetAddress: string;
    address2?: string;
    city: string;
    state: string;
    postalZip: string;
    country: string;
};

export type WebOrder = {
    orderNumber: string;
    totalPrice: string;
    note: string;
    items: WebOrderItem[];
    contactInfo: { email: string; phone: string };
    shippingAddress: WebOrderAddress;
    /** ISO timestamp. */
    createdAt: string;
};

export type WebOrderListItem = {
    orderNumber: string;
    email: string;
    shipToName: string;
    itemCount: number;
    totalPrice: string;
    /** ISO timestamp. */
    createdAt: string;
};

export type WebCartItem = {
    variantId: string;
    title: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
};

export type WebCartListItem = {
    id: string;
    email: string;
    totalQuantity: number;
    totalAmount: number;
    currencyCode: string;
    status: WebCartStatus;
    /** ISO timestamp. */
    updatedAt: string;
};

export type WebCart = WebCartListItem & {
    lineItems: WebCartItem[];
    /** ISO timestamps. */
    createdAt: string;
    expiresAt: string;
};
