'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { products } from '@/features/products/schema';
import { purchaseOrderItems, purchaseOrders, vendors } from './schema';
import {
    createPurchaseOrderSchema,
    createVendorSchema,
    receivePurchaseOrderSchema,
    updatePurchaseOrderDraftSchema,
    updateVendorSchema,
} from './validation';
import {
    canTransitionTo,
    computeLineTotal,
    computePoTotals,
    deriveStatusFromReceipts,
} from './service';
import type { ActionResult } from '@/types';

function firstIssue(issues: { message: string }[], fallback: string) {
    return issues[0]?.message ?? fallback;
}

// ---- Vendor CRUD ----

export async function createVendor(
    formData: FormData,
): Promise<ActionResult<{ id: number }>> {
    await requireAdmin();

    const parsed = createVendorSchema.safeParse(
        Object.fromEntries(formData.entries()),
    );
    if (!parsed.success) {
        return {
            success: false,
            error: firstIssue(parsed.error.issues, 'Invalid vendor data.'),
        };
    }

    const existing = await db
        .select({ id: vendors.id })
        .from(vendors)
        .where(eq(vendors.vendorCode, parsed.data.vendorCode))
        .limit(1);
    if (existing.length > 0) {
        return {
            success: false,
            error: 'A vendor with this vendor code already exists.',
        };
    }

    const [inserted] = await db
        .insert(vendors)
        .values({
            vendorCode: parsed.data.vendorCode,
            name: parsed.data.name,
            address1: parsed.data.address1 ?? null,
            address2: parsed.data.address2 ?? null,
            city: parsed.data.city ?? null,
            state: parsed.data.state ?? null,
            zip: parsed.data.zip ?? null,
            phone: parsed.data.phone ?? null,
            fax: parsed.data.fax ?? null,
            accountNumber: parsed.data.accountNumber ?? null,
            contactName: parsed.data.contactName ?? null,
            taxId: parsed.data.taxId ?? null,
            send1099: parsed.data.send1099,
            vendorType: parsed.data.vendorType,
            paymentTerms: parsed.data.paymentTerms ?? null,
            glAccountCode: parsed.data.glAccountCode ?? null,
            dateAdded: parsed.data.dateAdded ?? null,
            isActive: parsed.data.isActive,
        })
        .returning({ id: vendors.id });

    revalidatePath('/vendors');
    return { success: true, data: { id: inserted.id } };
}

export async function updateVendor(
    id: number,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const parsed = updateVendorSchema.safeParse(
        Object.fromEntries(formData.entries()),
    );
    if (!parsed.success) {
        return {
            success: false,
            error: firstIssue(parsed.error.issues, 'Invalid vendor data.'),
        };
    }

    const [existing] = await db
        .select({ id: vendors.id, vendorCode: vendors.vendorCode })
        .from(vendors)
        .where(eq(vendors.id, id))
        .limit(1);
    if (!existing) {
        return { success: false, error: 'Vendor not found.' };
    }

    if (parsed.data.vendorCode !== existing.vendorCode) {
        const [dupe] = await db
            .select({ id: vendors.id })
            .from(vendors)
            .where(eq(vendors.vendorCode, parsed.data.vendorCode))
            .limit(1);
        if (dupe) {
            return {
                success: false,
                error: 'A vendor with this vendor code already exists.',
            };
        }
    }

    await db
        .update(vendors)
        .set({
            vendorCode: parsed.data.vendorCode,
            name: parsed.data.name,
            address1: parsed.data.address1 ?? null,
            address2: parsed.data.address2 ?? null,
            city: parsed.data.city ?? null,
            state: parsed.data.state ?? null,
            zip: parsed.data.zip ?? null,
            phone: parsed.data.phone ?? null,
            fax: parsed.data.fax ?? null,
            accountNumber: parsed.data.accountNumber ?? null,
            contactName: parsed.data.contactName ?? null,
            taxId: parsed.data.taxId ?? null,
            send1099: parsed.data.send1099,
            vendorType: parsed.data.vendorType,
            paymentTerms: parsed.data.paymentTerms ?? null,
            glAccountCode: parsed.data.glAccountCode ?? null,
            dateAdded: parsed.data.dateAdded ?? null,
            isActive: parsed.data.isActive,
            updatedAt: new Date(),
        })
        .where(eq(vendors.id, id));

    revalidatePath('/vendors');
    revalidatePath(`/vendors/${id}`);
    return { success: true, data: undefined };
}

// ---- PO helpers ----

async function generatePoNumber(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
): Promise<string> {
    // Sequential PO numbers starting at PO100001.
    const prefix = 'PO';
    const start = 100001;
    const fromPos = prefix.length + 1;
    const [{ maxSuffix }] = await tx
        .select({
            maxSuffix: sql<number>`coalesce(max(substring(${purchaseOrders.poNumber} from ${fromPos}::int)::int), 0)`,
        })
        .from(purchaseOrders)
        .where(
            sql`${purchaseOrders.poNumber} like ${`${prefix}%`} and substring(${purchaseOrders.poNumber} from ${fromPos}::int) ~ '^[0-9]+$'`,
        );
    const next = Math.max((maxSuffix ?? 0) + 1, start);
    return `${prefix}${next}`;
}

async function loadProductsForItems(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    productIds: number[],
) {
    if (productIds.length === 0)
        return new Map<number, { itemNumber: string; description: string }>();
    const rows = await tx
        .select({
            productId: products.productId,
            itemNumber: products.itemNumber,
            description: products.description,
        })
        .from(products)
        .where(sql`${products.productId} in ${productIds}`);
    return new Map(
        rows.map((r) => [
            r.productId,
            { itemNumber: r.itemNumber, description: r.description },
        ]),
    );
}

// ---- PO create (draft) ----

export async function createPurchaseOrder(
    input: unknown,
): Promise<ActionResult<{ id: number; poNumber: string }>> {
    const session = await requireAdmin();

    const parsed = createPurchaseOrderSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            error: firstIssue(
                parsed.error.issues,
                'Invalid purchase order data.',
            ),
        };
    }

    const vendor = await db
        .select({ id: vendors.id, isActive: vendors.isActive })
        .from(vendors)
        .where(eq(vendors.id, parsed.data.vendorId))
        .limit(1);
    if (vendor.length === 0) {
        return { success: false, error: 'Vendor not found.' };
    }

    try {
        const result = await db.transaction(async (tx) => {
            const poNumber = await generatePoNumber(tx);
            const productMap = await loadProductsForItems(
                tx,
                parsed.data.items.map((i) => i.productId),
            );
            for (const line of parsed.data.items) {
                if (!productMap.has(line.productId)) {
                    throw new Error(`Product ${line.productId} not found.`);
                }
            }
            const totals = computePoTotals(
                parsed.data.items,
                parsed.data.freightAmount,
            );
            const [po] = await tx
                .insert(purchaseOrders)
                .values({
                    poNumber,
                    vendorId: parsed.data.vendorId,
                    status: 'draft',
                    orderDate: parsed.data.orderDate,
                    expectedDate: parsed.data.expectedDate ?? null,
                    subtotalAmount: totals.subtotalAmount,
                    freightAmount: totals.freightAmount,
                    totalAmount: totals.totalAmount,
                    notes: parsed.data.notes ?? null,
                    createdBy: session.employeeId,
                })
                .returning({
                    id: purchaseOrders.id,
                    poNumber: purchaseOrders.poNumber,
                });

            await tx.insert(purchaseOrderItems).values(
                parsed.data.items.map((line) => {
                    const p = productMap.get(line.productId)!;
                    return {
                        purchaseOrderId: po.id,
                        productId: line.productId,
                        itemNumber: p.itemNumber,
                        description: p.description,
                        qtyOrdered: line.qtyOrdered,
                        qtyReceived: 0,
                        unitCost: line.unitCost,
                        lineTotal: computeLineTotal(
                            line.qtyOrdered,
                            line.unitCost,
                        ),
                    };
                }),
            );

            return po;
        });

        revalidatePath('/purchase-orders');
        revalidatePath(`/vendors/${parsed.data.vendorId}`);
        return { success: true, data: result };
    } catch (err) {
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : 'Failed to create purchase order.',
        };
    }
}

// ---- PO update (draft only) ----

export async function updatePurchaseOrderDraft(
    purchaseOrderId: number,
    input: unknown,
): Promise<ActionResult> {
    await requireAdmin();

    const parsed = updatePurchaseOrderDraftSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            error: firstIssue(
                parsed.error.issues,
                'Invalid purchase order data.',
            ),
        };
    }

    try {
        await db.transaction(async (tx) => {
            const [po] = await tx
                .select({
                    id: purchaseOrders.id,
                    status: purchaseOrders.status,
                })
                .from(purchaseOrders)
                .where(eq(purchaseOrders.id, purchaseOrderId))
                .limit(1);
            if (!po) throw new Error('Purchase order not found.');
            if (po.status !== 'draft') {
                throw new Error('Only draft purchase orders can be edited.');
            }

            const productMap = await loadProductsForItems(
                tx,
                parsed.data.items.map((i) => i.productId),
            );
            for (const line of parsed.data.items) {
                if (!productMap.has(line.productId)) {
                    throw new Error(`Product ${line.productId} not found.`);
                }
            }

            const totals = computePoTotals(
                parsed.data.items,
                parsed.data.freightAmount,
            );

            await tx
                .update(purchaseOrders)
                .set({
                    vendorId: parsed.data.vendorId,
                    orderDate: parsed.data.orderDate,
                    expectedDate: parsed.data.expectedDate ?? null,
                    subtotalAmount: totals.subtotalAmount,
                    freightAmount: totals.freightAmount,
                    totalAmount: totals.totalAmount,
                    notes: parsed.data.notes ?? null,
                    updatedAt: new Date(),
                })
                .where(eq(purchaseOrders.id, purchaseOrderId));

            await tx
                .delete(purchaseOrderItems)
                .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

            await tx.insert(purchaseOrderItems).values(
                parsed.data.items.map((line) => {
                    const p = productMap.get(line.productId)!;
                    return {
                        purchaseOrderId,
                        productId: line.productId,
                        itemNumber: p.itemNumber,
                        description: p.description,
                        qtyOrdered: line.qtyOrdered,
                        qtyReceived: 0,
                        unitCost: line.unitCost,
                        lineTotal: computeLineTotal(
                            line.qtyOrdered,
                            line.unitCost,
                        ),
                    };
                }),
            );
        });

        revalidatePath('/purchase-orders');
        revalidatePath(`/purchase-orders/${purchaseOrderId}`);
        return { success: true, data: undefined };
    } catch (err) {
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : 'Failed to update purchase order.',
        };
    }
}

// ---- PO submit (draft → ordered) ----

export async function submitPurchaseOrder(
    purchaseOrderId: number,
): Promise<ActionResult> {
    await requireAdmin();

    try {
        await db.transaction(async (tx) => {
            const [po] = await tx
                .select({
                    id: purchaseOrders.id,
                    status: purchaseOrders.status,
                })
                .from(purchaseOrders)
                .where(eq(purchaseOrders.id, purchaseOrderId))
                .limit(1);
            if (!po) throw new Error('Purchase order not found.');
            if (!canTransitionTo(po.status, 'ordered')) {
                throw new Error(
                    `Cannot submit purchase order in status "${po.status}".`,
                );
            }

            const items = await tx
                .select({
                    productId: purchaseOrderItems.productId,
                    qtyOrdered: purchaseOrderItems.qtyOrdered,
                })
                .from(purchaseOrderItems)
                .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

            if (items.length === 0) {
                throw new Error(
                    'Cannot submit a purchase order with no line items.',
                );
            }

            for (const item of items) {
                await tx
                    .update(products)
                    .set({
                        qtyOnOrder: sql`${products.qtyOnOrder} + ${item.qtyOrdered}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(products.productId, item.productId));
            }

            await tx
                .update(purchaseOrders)
                .set({ status: 'ordered', updatedAt: new Date() })
                .where(eq(purchaseOrders.id, purchaseOrderId));
        });

        revalidatePath('/purchase-orders');
        revalidatePath(`/purchase-orders/${purchaseOrderId}`);
        revalidatePath('/products');
        return { success: true, data: undefined };
    } catch (err) {
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : 'Failed to submit purchase order.',
        };
    }
}

// ---- Receive items (partial or full) ----

export async function receivePurchaseOrderItems(
    input: unknown,
): Promise<ActionResult> {
    await requireAdmin();

    const parsed = receivePurchaseOrderSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            error: firstIssue(parsed.error.issues, 'Invalid receive data.'),
        };
    }

    try {
        await db.transaction(async (tx) => {
            const [po] = await tx
                .select({
                    id: purchaseOrders.id,
                    status: purchaseOrders.status,
                })
                .from(purchaseOrders)
                .where(eq(purchaseOrders.id, parsed.data.purchaseOrderId))
                .limit(1);
            if (!po) throw new Error('Purchase order not found.');
            if (po.status !== 'ordered' && po.status !== 'partially_received') {
                throw new Error(
                    `Cannot receive items on purchase order in status "${po.status}".`,
                );
            }

            const existingLines = await tx
                .select({
                    id: purchaseOrderItems.id,
                    productId: purchaseOrderItems.productId,
                    qtyOrdered: purchaseOrderItems.qtyOrdered,
                    qtyReceived: purchaseOrderItems.qtyReceived,
                })
                .from(purchaseOrderItems)
                .where(
                    eq(
                        purchaseOrderItems.purchaseOrderId,
                        parsed.data.purchaseOrderId,
                    ),
                );

            const lineMap = new Map(existingLines.map((l) => [l.id, l]));

            for (const recv of parsed.data.lines) {
                if (recv.qtyToReceive <= 0) continue;
                const line = lineMap.get(recv.lineId);
                if (!line) {
                    throw new Error(`Line ${recv.lineId} not found on PO.`);
                }
                const remaining = line.qtyOrdered - line.qtyReceived;
                if (recv.qtyToReceive > remaining) {
                    throw new Error(
                        `Cannot receive more than remaining qty (${remaining}) on line ${line.id}.`,
                    );
                }

                await tx
                    .update(purchaseOrderItems)
                    .set({
                        qtyReceived: sql`${purchaseOrderItems.qtyReceived} + ${recv.qtyToReceive}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(purchaseOrderItems.id, line.id));

                await tx
                    .update(products)
                    .set({
                        qtyInStock: sql`${products.qtyInStock} + ${recv.qtyToReceive}`,
                        qtyOnOrder: sql`${products.qtyOnOrder} - ${recv.qtyToReceive}`,
                        qtyAvailable: sql`${products.qtyInStock} + ${recv.qtyToReceive} - ${products.qtyCommitted}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(products.productId, line.productId));
            }

            // Recompute PO status from latest receipts.
            const refreshed = await tx
                .select({
                    qtyOrdered: purchaseOrderItems.qtyOrdered,
                    qtyReceived: purchaseOrderItems.qtyReceived,
                })
                .from(purchaseOrderItems)
                .where(
                    eq(
                        purchaseOrderItems.purchaseOrderId,
                        parsed.data.purchaseOrderId,
                    ),
                );
            const nextStatus = deriveStatusFromReceipts(refreshed);

            await tx
                .update(purchaseOrders)
                .set({
                    status: nextStatus,
                    receivedDate:
                        nextStatus === 'received'
                            ? parsed.data.receivedDate
                            : null,
                    updatedAt: new Date(),
                })
                .where(eq(purchaseOrders.id, parsed.data.purchaseOrderId));
        });

        revalidatePath('/purchase-orders');
        revalidatePath(`/purchase-orders/${parsed.data.purchaseOrderId}`);
        revalidatePath('/products');
        return { success: true, data: undefined };
    } catch (err) {
        return {
            success: false,
            error:
                err instanceof Error ? err.message : 'Failed to receive items.',
        };
    }
}

// ---- Cancel PO ----

export async function cancelPurchaseOrder(
    purchaseOrderId: number,
): Promise<ActionResult> {
    await requireAdmin();

    try {
        await db.transaction(async (tx) => {
            const [po] = await tx
                .select({
                    id: purchaseOrders.id,
                    status: purchaseOrders.status,
                })
                .from(purchaseOrders)
                .where(eq(purchaseOrders.id, purchaseOrderId))
                .limit(1);
            if (!po) throw new Error('Purchase order not found.');
            if (!canTransitionTo(po.status, 'cancelled')) {
                throw new Error(
                    `Cannot cancel purchase order in status "${po.status}".`,
                );
            }

            // For non-draft POs, reverse remaining qtyOnOrder contributions.
            if (po.status !== 'draft') {
                const items = await tx
                    .select({
                        productId: purchaseOrderItems.productId,
                        qtyOrdered: purchaseOrderItems.qtyOrdered,
                        qtyReceived: purchaseOrderItems.qtyReceived,
                    })
                    .from(purchaseOrderItems)
                    .where(
                        eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
                    );
                for (const item of items) {
                    const remaining = item.qtyOrdered - item.qtyReceived;
                    if (remaining <= 0) continue;
                    await tx
                        .update(products)
                        .set({
                            qtyOnOrder: sql`${products.qtyOnOrder} - ${remaining}`,
                            updatedAt: new Date(),
                        })
                        .where(eq(products.productId, item.productId));
                }
            }

            await tx
                .update(purchaseOrders)
                .set({ status: 'cancelled', updatedAt: new Date() })
                .where(eq(purchaseOrders.id, purchaseOrderId));
        });

        revalidatePath('/purchase-orders');
        revalidatePath(`/purchase-orders/${purchaseOrderId}`);
        revalidatePath('/products');
        return { success: true, data: undefined };
    } catch (err) {
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : 'Failed to cancel purchase order.',
        };
    }
}
