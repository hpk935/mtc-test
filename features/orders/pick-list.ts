// Pick-list math: weight and cube are per master case, so a line's figures
// scale by how many master cases were ordered.

interface PickListItem {
    qtyOrdered: number;
    maxQty: number | null;
    caseWeight: string | null;
    cubicFeet: string | null;
    unitPrice: string;
    discount: string;
    lineTotal: string;
}

export function buildPickList<T extends PickListItem>(items: T[]) {
    const lines = items.map((item) => {
        const cases = item.maxQty ? item.qtyOrdered / item.maxQty : 0;
        return {
            ...item,
            weight: cases * Number(item.caseWeight ?? 0),
            cube: cases * Number(item.cubicFeet ?? 0),
            // A discount is the net price that replaces the unit price.
            netPrice:
                Number(item.discount) > 0 ? item.discount : item.unitPrice,
        };
    });

    const totals = lines.reduce(
        (sum, line) => ({
            qty: sum.qty + line.qtyOrdered,
            weight: sum.weight + line.weight,
            cube: sum.cube + line.cube,
            amount: sum.amount + Number(line.lineTotal),
        }),
        { qty: 0, weight: 0, cube: 0, amount: 0 },
    );

    return { lines, totals };
}
