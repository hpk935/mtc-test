import { eq, sql } from 'drizzle-orm';
import db from '@/lib/db';
import { orders, orderItems } from './schema';
import { getMaxOrderNumber } from './queries';
import { findCustomerByNumber } from '@/features/customers/queries';
import { findShipToAddress } from '@/features/customers/queries';
import { findProductByItemNumber } from '@/features/products/queries';
import { products } from '@/features/products/schema';
import { invoices } from '@/features/invoices/schema';
import { invoiceItems } from '@/features/invoices/schema';
import type { CreateOrderInput, UpdateOrderInput } from './validation';

interface ValidatedItem {
    itemNumber: string;
    qtyOrdered: number;
    unitPrice: string;
    discount: string;
    unitCost: string;
    lineTotal: string;
}

// --- Inventory helpers ---

async function commitInventory(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    items: { itemNumber: string; qty: number }[],
) {
    for (const item of items) {
        await tx
            .update(products)
            .set({
                qtyCommitted: sql`${products.qtyCommitted} + ${item.qty}`,
                qtyAvailable: sql`${products.qtyInStock} - ${products.qtyCommitted} - ${item.qty}`,
                updatedAt: new Date(),
            })
            .where(eq(products.itemNumber, item.itemNumber));
    }
}

async function releaseInventory(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    items: { itemNumber: string; qty: number }[],
) {
    for (const item of items) {
        await tx
            .update(products)
            .set({
                qtyCommitted: sql`${products.qtyCommitted} - ${item.qty}`,
                qtyAvailable: sql`${products.qtyInStock} - ${products.qtyCommitted} + ${item.qty}`,
                updatedAt: new Date(),
            })
            .where(eq(products.itemNumber, item.itemNumber));
    }
}

async function fulfillInventory(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    items: { itemNumber: string; qty: number }[],
) {
    for (const item of items) {
        await tx
            .update(products)
            .set({
                qtyInStock: sql`${products.qtyInStock} - ${item.qty}`,
                qtyCommitted: sql`${products.qtyCommitted} - ${item.qty}`,
                qtyAvailable: sql`${products.qtyInStock} - ${products.qtyCommitted}`,
                updatedAt: new Date(),
            })
            .where(eq(products.itemNumber, item.itemNumber));
    }
}

async function getOrderItemQuantities(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    orderNumber: string,
) {
    return tx
        .select({
            itemNumber: orderItems.itemNumber,
            qtyOrdered: orderItems.qtyOrdered,
        })
        .from(orderItems)
        .where(eq(orderItems.orderNumber, orderNumber));
}

async function findRawOrder(orderNumber: string) {
    const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, orderNumber))
        .limit(1);
    return order ?? null;
}

export async function generateOrderNumber(): Promise<string> {
    const maxExisting = await getMaxOrderNumber();
    const next = Math.max(10001, maxExisting + 1);
    return next.toString();
}

export async function createOrderRecord(input: CreateOrderInput) {
    // Validate customer exists
    const customer = await findCustomerByNumber(input.customerNumber);
    if (!customer) {
        return { success: false as const, error: 'Customer not found.' };
    }

    // Validate ship-to address
    const shipTo = await findShipToAddress(input.shipToId);
    if (!shipTo) {
        return {
            success: false as const,
            error: 'Ship-to address not found.',
        };
    }

    if (shipTo.customerNumber !== input.customerNumber) {
        return {
            success: false as const,
            error: 'Ship-to address does not belong to this customer.',
        };
    }

    // Validate line items and look up products
    const validatedItems: ValidatedItem[] = [];
    for (const item of input.lineItems) {
        const product = await findProductByItemNumber(item.itemNumber);
        if (!product) {
            return {
                success: false as const,
                error: `Product "${item.itemNumber}" not found.`,
            };
        }
        const effectivePrice =
            item.discount > 0 ? item.discount : item.unitPrice;
        const lineTotal =
            Math.round(item.qtyOrdered * effectivePrice * 100) / 100;
        validatedItems.push({
            itemNumber: item.itemNumber,
            qtyOrdered: item.qtyOrdered,
            unitPrice: String(item.unitPrice),
            discount: String(item.discount),
            unitCost: product.landedCost,
            lineTotal: String(Math.max(0, lineTotal)),
        });
    }

    const subtotal = validatedItems.reduce(
        (sum, i) => sum + Number(i.lineTotal),
        0,
    );
    const total = subtotal + input.freightAmount + input.salesTaxAmount;

    const orderNumber = await generateOrderNumber();

    await db.transaction(async (tx) => {
        await tx.insert(orders).values({
            orderNumber,
            customerNumber: input.customerNumber,
            salespersonCode: input.salespersonCode,
            orderDate: input.orderDate,
            customerPoReference: input.customerPoReference || null,
            freightTerm: input.freightTerm,
            shipToId: input.shipToId,
            shipToName: shipTo.locationName,
            shipToAddress1: shipTo.address1,
            shipToAddress2: shipTo.address2,
            shipToCity: shipTo.city,
            shipToStateCode: shipTo.stateCode,
            shipToPostalCode: shipTo.postalCode,
            termCode: input.termCode,
            territoryCode: input.territoryCode,
            salesTaxAmount: String(input.salesTaxAmount),
            subtotalAmount: String(Math.round(subtotal * 100) / 100),
            freightAmount: String(input.freightAmount),
            totalAmount: String(Math.round(total * 100) / 100),
            costAmount: String(
                Math.round(
                    validatedItems.reduce(
                        (sum, i) =>
                            sum +
                            Number(i.unitCost) *
                                (input.lineItems.find(
                                    (li) => li.itemNumber === i.itemNumber,
                                )?.qtyOrdered ?? 0),
                        0,
                    ) * 100,
                ) / 100,
            ),
            shippingNote: input.shippingNote || null,
        });

        if (validatedItems.length > 0) {
            await tx.insert(orderItems).values(
                validatedItems.map((item) => ({
                    orderNumber,
                    itemNumber: item.itemNumber,
                    qtyOrdered: item.qtyOrdered,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    unitCost: item.unitCost,
                    lineTotal: item.lineTotal,
                })),
            );

            // Commit inventory for ordered items
            await commitInventory(
                tx,
                validatedItems.map((i) => ({
                    itemNumber: i.itemNumber,
                    qty: i.qtyOrdered,
                })),
            );
        }
    });

    return { success: true as const, data: orderNumber };
}

// --- Update ---

export async function updateOrderRecord(
    orderNumber: string,
    input: UpdateOrderInput,
) {
    const existing = await findRawOrder(orderNumber);
    if (!existing) {
        return { success: false as const, error: 'Order not found.' };
    }
    if (existing.orderStatus !== 'open') {
        return {
            success: false as const,
            error: 'Only open orders can be edited.',
        };
    }

    const customer = await findCustomerByNumber(input.customerNumber);
    if (!customer) {
        return { success: false as const, error: 'Customer not found.' };
    }

    const shipTo = await findShipToAddress(input.shipToId);
    if (!shipTo) {
        return { success: false as const, error: 'Ship-to address not found.' };
    }
    if (shipTo.customerNumber !== input.customerNumber) {
        return {
            success: false as const,
            error: 'Ship-to address does not belong to this customer.',
        };
    }

    const validatedItems: ValidatedItem[] = [];
    for (const item of input.lineItems) {
        const product = await findProductByItemNumber(item.itemNumber);
        if (!product) {
            return {
                success: false as const,
                error: `Product "${item.itemNumber}" not found.`,
            };
        }
        const effectivePrice =
            item.discount > 0 ? item.discount : item.unitPrice;
        const lineTotal =
            Math.round(item.qtyOrdered * effectivePrice * 100) / 100;
        validatedItems.push({
            itemNumber: item.itemNumber,
            qtyOrdered: item.qtyOrdered,
            unitPrice: String(item.unitPrice),
            discount: String(item.discount),
            unitCost: product.landedCost,
            lineTotal: String(Math.max(0, lineTotal)),
        });
    }

    const subtotal = validatedItems.reduce(
        (sum, i) => sum + Number(i.lineTotal),
        0,
    );
    const total = subtotal + input.freightAmount + input.salesTaxAmount;

    await db.transaction(async (tx) => {
        await tx
            .update(orders)
            .set({
                customerNumber: input.customerNumber,
                salespersonCode: input.salespersonCode,
                orderDate: input.orderDate,
                customerPoReference: input.customerPoReference || null,
                freightTerm: input.freightTerm,
                shipToId: input.shipToId,
                shipToName: shipTo.locationName,
                shipToAddress1: shipTo.address1,
                shipToAddress2: shipTo.address2,
                shipToCity: shipTo.city,
                shipToStateCode: shipTo.stateCode,
                shipToPostalCode: shipTo.postalCode,
                termCode: input.termCode,
                territoryCode: input.territoryCode,
                salesTaxAmount: String(input.salesTaxAmount),
                subtotalAmount: String(Math.round(subtotal * 100) / 100),
                freightAmount: String(input.freightAmount),
                totalAmount: String(Math.round(total * 100) / 100),
                costAmount: String(
                    Math.round(
                        validatedItems.reduce(
                            (sum, i) =>
                                sum +
                                Number(i.unitCost) *
                                    (input.lineItems.find(
                                        (li) => li.itemNumber === i.itemNumber,
                                    )?.qtyOrdered ?? 0),
                            0,
                        ) * 100,
                    ) / 100,
                ),
                shippingNote: input.shippingNote || null,
                updatedAt: new Date(),
            })
            .where(eq(orders.orderNumber, orderNumber));

        // Release old inventory commitments
        const oldItems = await getOrderItemQuantities(tx, orderNumber);
        if (oldItems.length > 0) {
            await releaseInventory(
                tx,
                oldItems.map((i) => ({
                    itemNumber: i.itemNumber,
                    qty: i.qtyOrdered,
                })),
            );
        }

        // Delete old items and re-insert
        await tx
            .delete(orderItems)
            .where(eq(orderItems.orderNumber, orderNumber));

        if (validatedItems.length > 0) {
            await tx.insert(orderItems).values(
                validatedItems.map((item) => ({
                    orderNumber,
                    itemNumber: item.itemNumber,
                    qtyOrdered: item.qtyOrdered,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    unitCost: item.unitCost,
                    lineTotal: item.lineTotal,
                })),
            );

            // Commit new inventory
            await commitInventory(
                tx,
                validatedItems.map((i) => ({
                    itemNumber: i.itemNumber,
                    qty: i.qtyOrdered,
                })),
            );
        }
    });

    return { success: true as const, data: orderNumber };
}

// --- Delete ---

export async function deleteOrderRecord(orderNumber: string) {
    const existing = await findRawOrder(orderNumber);
    if (!existing) {
        return { success: false as const, error: 'Order not found.' };
    }
    if (existing.orderStatus !== 'open') {
        return {
            success: false as const,
            error: 'Only open orders can be deleted.',
        };
    }

    await db.transaction(async (tx) => {
        // Release inventory commitments before deleting
        const items = await getOrderItemQuantities(tx, orderNumber);
        if (items.length > 0) {
            await releaseInventory(
                tx,
                items.map((i) => ({
                    itemNumber: i.itemNumber,
                    qty: i.qtyOrdered,
                })),
            );
        }

        await tx
            .delete(orderItems)
            .where(eq(orderItems.orderNumber, orderNumber));
        await tx.delete(orders).where(eq(orders.orderNumber, orderNumber));
    });

    return { success: true as const };
}

// --- Void ---

export async function voidOrderRecord(orderNumber: string) {
    const existing = await findRawOrder(orderNumber);
    if (!existing) {
        return { success: false as const, error: 'Order not found.' };
    }
    if (existing.orderStatus !== 'open') {
        return {
            success: false as const,
            error: 'Only open orders can be voided.',
        };
    }

    await db.transaction(async (tx) => {
        // Release inventory commitments for voided order
        const items = await getOrderItemQuantities(tx, orderNumber);
        if (items.length > 0) {
            await releaseInventory(
                tx,
                items.map((i) => ({
                    itemNumber: i.itemNumber,
                    qty: i.qtyOrdered,
                })),
            );
        }

        await tx
            .update(orders)
            .set({ orderStatus: 'voided', updatedAt: new Date() })
            .where(eq(orders.orderNumber, orderNumber));
    });

    return { success: true as const };
}

// --- Post to Invoice ---

async function getMaxInvoiceNumber(): Promise<number> {
    const [result] = await db
        .select({
            maxNum: sql<number>`coalesce(max(cast(${invoices.invoiceNumber} as integer)), 0)`,
        })
        .from(invoices)
        .where(sql`${invoices.invoiceNumber} ~ '^[0-9]+$'`);
    return result?.maxNum ?? 0;
}

export async function postOrderToInvoice(orderNumber: string) {
    const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, orderNumber))
        .limit(1);

    if (!order) {
        return { success: false as const, error: 'Order not found.' };
    }
    if (order.orderStatus !== 'open') {
        return {
            success: false as const,
            error: 'Only open orders can be posted to invoice.',
        };
    }

    const maxInvoice = await getMaxInvoiceNumber();
    const invoiceNumber = String(Math.max(10001, maxInvoice + 1));
    const today = new Date().toISOString().split('T')[0];

    await db.transaction(async (tx) => {
        // Create the invoice record
        await tx.insert(invoices).values({
            invoiceNumber,
            orderNumber,
            customerNumber: order.customerNumber,
            salespersonCode: order.salespersonCode,
            invoiceDate: today,
            customerPoReference: order.customerPoReference,
            freightTerm: order.freightTerm,
            shipToId: order.shipToId,
            shipToName: order.shipToName,
            shipToAddress1: order.shipToAddress1,
            shipToAddress2: order.shipToAddress2,
            shipToCity: order.shipToCity,
            shipToStateCode: order.shipToStateCode,
            shipToPostalCode: order.shipToPostalCode,
            termCode: order.termCode,
            territoryCode: order.territoryCode,
            salesTaxAmount: order.salesTaxAmount,
            subtotalAmount: order.subtotalAmount,
            freightAmount: order.freightAmount,
            totalAmount: order.totalAmount,
            costAmount: order.costAmount,
            balanceDue: order.totalAmount,
            shippingNote: order.shippingNote,
        });

        // Fetch order items for inventory fulfillment
        const items = await getOrderItemQuantities(tx, orderNumber);

        // Link order items to this invoice and set qtyShipped = qtyOrdered
        await tx
            .update(orderItems)
            .set({
                invoiceNumber,
                qtyShipped: sql`${orderItems.qtyOrdered}`,
                updatedAt: new Date(),
            })
            .where(eq(orderItems.orderNumber, orderNumber));

        // Mirror order items into invoice_items (the authoritative billed
        // line items table the invoice detail page reads from).
        const orderItemRows = await tx
            .select({
                itemNumber: orderItems.itemNumber,
                unitPrice: orderItems.unitPrice,
                qtyOrdered: orderItems.qtyOrdered,
                discount: orderItems.discount,
                unitCost: orderItems.unitCost,
                lineTotal: orderItems.lineTotal,
            })
            .from(orderItems)
            .where(eq(orderItems.orderNumber, orderNumber));

        if (orderItemRows.length > 0) {
            await tx.insert(invoiceItems).values(
                orderItemRows.map((row) => ({
                    invoiceNumber,
                    orderNumber,
                    itemNumber: row.itemNumber,
                    unitPrice: row.unitPrice,
                    qtyOrdered: row.qtyOrdered,
                    qtyShipped: row.qtyOrdered,
                    discount: row.discount,
                    unitCost: row.unitCost,
                    lineTotal: row.lineTotal,
                })),
            );
        }

        // Fulfill inventory: decrement qtyInStock, zero out qtyCommitted for these items
        if (items.length > 0) {
            await fulfillInventory(
                tx,
                items.map((i) => ({
                    itemNumber: i.itemNumber,
                    qty: i.qtyOrdered,
                })),
            );
        }

        // Mark order as invoiced
        await tx
            .update(orders)
            .set({ orderStatus: 'invoiced', updatedAt: new Date() })
            .where(eq(orders.orderNumber, orderNumber));
    });

    return { success: true as const, data: invoiceNumber };
}
