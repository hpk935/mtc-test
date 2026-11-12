import { ObjectId, type Document } from 'mongodb';
import { storefrontDb } from '@/lib/mongo';
import { cartDisplayStatus, type WebCartStatus } from './cart-status';
import { webCartFilter, webOrderFilter } from './filters';
import type {
    WebCart,
    WebCartListItem,
    WebOrder,
    WebOrderListItem,
} from './types';

// Read-only queries against the storefront's MongoDB (`orders` and
// `usercarts`), flattened into the plain shapes in ./types.

function iso(value: unknown): string {
    return value instanceof Date
        ? value.toISOString()
        : new Date(String(value)).toISOString();
}

function text(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
}

export async function listWebOrders({
    search,
    page,
    pageSize,
}: {
    search?: string;
    page: number;
    pageSize: number;
}): Promise<{
    orders: WebOrderListItem[];
    totalCount: number;
    totalPages: number;
}> {
    const orders = (await storefrontDb()).collection('orders');
    const filter = webOrderFilter({ search });

    const [docs, totalCount] = await Promise.all([
        orders
            .aggregate([
                { $match: filter },
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * pageSize },
                { $limit: pageSize },
                {
                    $project: {
                        orderNumber: 1,
                        createdAt: 1,
                        totalPrice: 1,
                        email: '$contactInfo.email',
                        firstName: '$shippingAddress.firstName',
                        lastName: '$shippingAddress.lastName',
                        itemCount: { $size: { $ifNull: ['$items', []] } },
                    },
                },
            ])
            .toArray(),
        orders.countDocuments(filter),
    ]);

    return {
        orders: docs.map((doc) => ({
            orderNumber: text(doc.orderNumber),
            email: text(doc.email),
            shipToName: `${text(doc.firstName)} ${text(doc.lastName)}`.trim(),
            itemCount: doc.itemCount,
            totalPrice: text(doc.totalPrice),
            createdAt: iso(doc.createdAt),
        })),
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}

export async function findWebOrder(
    orderNumber: string,
): Promise<WebOrder | null> {
    const doc = await (await storefrontDb())
        .collection('orders')
        .findOne({ orderNumber });
    if (!doc) return null;

    const addr = doc.shippingAddress ?? {};
    return {
        orderNumber: text(doc.orderNumber),
        totalPrice: text(doc.totalPrice),
        note: text(doc.note),
        createdAt: iso(doc.createdAt),
        contactInfo: {
            email: text(doc.contactInfo?.email),
            phone: text(doc.contactInfo?.phone),
        },
        shippingAddress: {
            firstName: text(addr.firstName),
            lastName: text(addr.lastName),
            streetAddress: text(addr.streetAddress),
            address2: text(addr.address2),
            city: text(addr.city),
            state: text(addr.state),
            postalZip: text(addr.postalZip),
            country: text(addr.country),
        },
        items: ((doc.items ?? []) as Document[]).map((item) => ({
            name: text(item.name),
            sku: text(item.sku),
            upc: text(item.upc),
            quantity: Number(item.quantity) || 0,
            amountPerQuantity: text(item.amountPerQuantity),
            totalAmount: text(item.totalAmount),
            casePack: text(item.casePack),
            imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
        })),
    };
}

function toCartListItem(doc: Document, now: Date): WebCartListItem {
    return {
        id: doc._id.toString(),
        email: text(doc.buyerIdentity?.email),
        totalQuantity: Number(doc.totalQuantity) || 0,
        totalAmount: Number(doc.totalAmount) || 0,
        currencyCode: text(doc.currencyCode) || 'USD',
        status: cartDisplayStatus(
            { status: text(doc.status), expiresAt: doc.expiresAt },
            now,
        ),
        updatedAt: iso(doc.updatedAt),
    };
}

export async function listWebCarts({
    status,
    search,
    page,
    pageSize,
}: {
    status?: WebCartStatus;
    search?: string;
    page: number;
    pageSize: number;
}): Promise<{
    carts: WebCartListItem[];
    totalCount: number;
    totalPages: number;
}> {
    const now = new Date();
    const carts = (await storefrontDb()).collection('usercarts');
    const filter = webCartFilter({ status, search }, now);

    const [docs, totalCount] = await Promise.all([
        carts
            .find(filter, { projection: { lineItems: 0 } })
            .sort({ updatedAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray(),
        carts.countDocuments(filter),
    ]);

    return {
        carts: docs.map((doc) => toCartListItem(doc, now)),
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
    };
}

export async function findWebCart(id: string): Promise<WebCart | null> {
    // Anything that isn't a 24-hex id can't be a cart (and ObjectId would
    // accept some 12-character strings).
    if (!/^[0-9a-f]{24}$/i.test(id)) return null;

    const doc = await (await storefrontDb())
        .collection('usercarts')
        .findOne({ _id: new ObjectId(id) });
    if (!doc) return null;

    return {
        ...toCartListItem(doc, new Date()),
        shopifyCartId: text(doc.shopifyCartId),
        phone: doc.buyerIdentity?.phone
            ? String(doc.buyerIdentity.phone)
            : undefined,
        createdAt: iso(doc.createdAt),
        expiresAt: iso(doc.expiresAt),
        lineItems: ((doc.lineItems ?? []) as Document[]).map((item) => ({
            variantId: text(item.variantId),
            title: text(item.title),
            sku: text(item.sku),
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
        })),
    };
}
