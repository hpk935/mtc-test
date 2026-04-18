import { ilike, or, and, count, asc, eq, sql } from 'drizzle-orm';
import db from '@/lib/db';
import { products } from './schema';

const PAGE_SIZE_DEFAULT = 20;

export async function getProducts({
    search,
    discontinued,
    page = 1,
    pageSize = PAGE_SIZE_DEFAULT,
}: {
    search?: string;
    discontinued?: boolean;
    page?: number;
    pageSize?: number;
} = {}) {
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (discontinued !== undefined) {
        conditions.push(eq(products.isDiscontinued, discontinued));
    }

    if (search) {
        conditions.push(
            or(
                ilike(products.itemNumber, `%${search}%`),
                ilike(products.description, `%${search}%`),
                ilike(products.upcNumber, `%${search}%`),
            )!,
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
        db
            .select({
                productId: products.productId,
                itemNumber: products.itemNumber,
                description: products.description,
                productType: products.productType,
                casePrice: products.casePrice,
                minimumPackPrice: products.minimumPackPrice,
                caseWeight: products.caseWeight,
                maxQty: products.maxQty,
                qtyInStock: products.qtyInStock,
                qtyAvailable: products.qtyAvailable,
                isDiscontinued: products.isDiscontinued,
            })
            .from(products)
            .where(whereClause)
            .orderBy(asc(products.itemNumber))
            .limit(pageSize)
            .offset(offset),
        db.select({ total: count() }).from(products).where(whereClause),
    ]);

    return {
        products: data,
        totalCount: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

export type ProductListItem = Awaited<
    ReturnType<typeof getProducts>
>['products'][number];

export async function findProductById(productId: number) {
    const [product] = await db
        .select()
        .from(products)
        .where(eq(products.productId, productId))
        .limit(1);
    return product ?? null;
}

export async function findProductByItemNumber(itemNumber: string) {
    const [product] = await db
        .select()
        .from(products)
        .where(eq(products.itemNumber, itemNumber))
        .limit(1);
    return product ?? null;
}

export async function getMaxProductId(): Promise<number> {
    const [result] = await db
        .select({
            maxId: sql<number>`coalesce(max(${products.productId}), 0)`,
        })
        .from(products);
    return result?.maxId ?? 0;
}
