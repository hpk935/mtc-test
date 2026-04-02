import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { products } from './schema';
import {
    findProductById,
    findProductByItemNumber,
    getMaxProductId,
} from './queries';
import type { CreateProductInput, UpdateProductInput } from './validation';

function normalizeOptional(value: string | undefined): string | null {
    return value && value.trim() !== '' ? value : null;
}

export async function generateProductId(): Promise<number> {
    const maxExisting = await getMaxProductId();
    return maxExisting + 1;
}

export async function createProductRecord(
    input: CreateProductInput & { productId: number },
) {
    const existingItem = await findProductByItemNumber(input.itemNumber);
    if (existingItem) {
        return {
            success: false as const,
            error: 'A product with this item number already exists.',
        };
    }

    await db.insert(products).values({
        productId: input.productId,
        itemNumber: input.itemNumber,
        description: input.description,
        cartonNumber: normalizeOptional(input.cartonNumber),
        unitSoldBy: input.unitSoldBy,
        minQty: input.minQty,
        maxQty: input.maxQty,
        productType: input.productType,
        dimensionsL: input.dimensionsL,
        dimensionsW: input.dimensionsW,
        dimensionsH: input.dimensionsH,
        cubicFeet: input.cubicFeet,
        caseWeight: input.caseWeight,
        upcNumber: normalizeOptional(input.upcNumber),
        landedCost: input.landedCost,
        minimumPackPrice: input.minimumPackPrice,
        casePrice: input.casePrice,
        itemCostHk: input.itemCostHk,
        qtyInStock: input.qtyInStock,
        qtyCommitted: input.qtyCommitted,
        qtyAvailable: input.qtyAvailable,
        qtyOnOrder: input.qtyOnOrder,
        upcomingShipmentNo: normalizeOptional(input.upcomingShipmentNo),
        upcomingShipmentArrival: normalizeOptional(
            input.upcomingShipmentArrival,
        ),
        upcomingShipmentQty: input.upcomingShipmentQty ?? null,
        nob: input.nob ?? null,
        isDiscontinued: input.isDiscontinued,
        htsCode: normalizeOptional(input.htsCode),
        leadTime: normalizeOptional(input.leadTime),
    });

    return { success: true as const, data: input.productId };
}

export async function updateProductRecord(
    productId: number,
    input: UpdateProductInput,
) {
    const existing = await findProductById(productId);
    if (!existing) {
        return { success: false as const, error: 'Product not found.' };
    }

    // Check for item number uniqueness if it changed
    if (input.itemNumber !== existing.itemNumber) {
        const duplicate = await findProductByItemNumber(input.itemNumber);
        if (duplicate) {
            return {
                success: false as const,
                error: 'A product with this item number already exists.',
            };
        }
    }

    await db
        .update(products)
        .set({
            itemNumber: input.itemNumber,
            description: input.description,
            cartonNumber: normalizeOptional(input.cartonNumber),
            unitSoldBy: input.unitSoldBy,
            minQty: input.minQty,
            maxQty: input.maxQty,
            productType: input.productType,
            dimensionsL: input.dimensionsL,
            dimensionsW: input.dimensionsW,
            dimensionsH: input.dimensionsH,
            cubicFeet: input.cubicFeet,
            caseWeight: input.caseWeight,
            upcNumber: normalizeOptional(input.upcNumber),
            landedCost: input.landedCost,
            minimumPackPrice: input.minimumPackPrice,
            casePrice: input.casePrice,
            itemCostHk: input.itemCostHk,
            qtyInStock: input.qtyInStock,
            qtyCommitted: input.qtyCommitted,
            qtyAvailable: input.qtyAvailable,
            qtyOnOrder: input.qtyOnOrder,
            upcomingShipmentNo: normalizeOptional(input.upcomingShipmentNo),
            upcomingShipmentArrival: normalizeOptional(
                input.upcomingShipmentArrival,
            ),
            upcomingShipmentQty: input.upcomingShipmentQty ?? null,
            nob: input.nob ?? null,
            isDiscontinued: input.isDiscontinued,
            htsCode: normalizeOptional(input.htsCode),
            leadTime: normalizeOptional(input.leadTime),
            updatedAt: new Date(),
        })
        .where(eq(products.productId, productId));

    return { success: true as const, data: undefined };
}
