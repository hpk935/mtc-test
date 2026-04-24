import type { PurchaseOrderStatus } from './constants';

export type StockDelta = {
    productId: number;
    inStockDelta: number;
    onOrderDelta: number;
};

export function computeOrderSubmitDeltas(
    items: { productId: number; qtyOrdered: number }[],
): StockDelta[] {
    return items.map((i) => ({
        productId: i.productId,
        inStockDelta: 0,
        onOrderDelta: i.qtyOrdered,
    }));
}

export function computeCancelDeltas(
    items: { productId: number; qtyOrdered: number; qtyReceived: number }[],
): StockDelta[] {
    // Cancel only reverses the unreceived remainder from qtyOnOrder.
    return items.map((i) => ({
        productId: i.productId,
        inStockDelta: 0,
        onOrderDelta: -(i.qtyOrdered - i.qtyReceived),
    }));
}

export function computeReceiveDeltas(
    receipts: {
        productId: number;
        qtyToReceive: number;
    }[],
): StockDelta[] {
    return receipts
        .filter((r) => r.qtyToReceive > 0)
        .map((r) => ({
            productId: r.productId,
            inStockDelta: r.qtyToReceive,
            onOrderDelta: -r.qtyToReceive,
        }));
}

export function computeLineTotal(qty: number, unitCost: string): string {
    const cost = Number(unitCost);
    return (qty * cost).toFixed(2);
}

export function computePoTotals(
    items: { qtyOrdered: number; unitCost: string }[],
    freightAmount: string,
) {
    const subtotal = items.reduce(
        (sum, i) => sum + i.qtyOrdered * Number(i.unitCost),
        0,
    );
    const freight = Number(freightAmount || '0');
    return {
        subtotalAmount: subtotal.toFixed(2),
        freightAmount: freight.toFixed(2),
        totalAmount: (subtotal + freight).toFixed(2),
    };
}

export function deriveStatusFromReceipts(
    items: {
        qtyOrdered: number;
        qtyReceived: number;
    }[],
): Extract<PurchaseOrderStatus, 'ordered' | 'partially_received' | 'received'> {
    const totalOrdered = items.reduce((s, i) => s + i.qtyOrdered, 0);
    const totalReceived = items.reduce((s, i) => s + i.qtyReceived, 0);
    if (totalReceived <= 0) return 'ordered';
    if (totalReceived >= totalOrdered) return 'received';
    return 'partially_received';
}

export function canTransitionTo(
    from: PurchaseOrderStatus,
    to: PurchaseOrderStatus,
): boolean {
    const allowed: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
        draft: ['ordered', 'cancelled'],
        ordered: ['partially_received', 'received', 'cancelled'],
        partially_received: ['partially_received', 'received', 'cancelled'],
        received: [],
        cancelled: [],
    };
    return allowed[from].includes(to);
}
