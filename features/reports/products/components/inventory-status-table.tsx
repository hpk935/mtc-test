import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import {
  isColumnVisible,
  type ReportColumn,
} from '@/features/reports/components/report-columns';
import type { InventoryStatusRow } from '@/features/reports/products/queries';

export const INVENTORY_STATUS_COLUMNS: ReportColumn[] = [
  { key: 'item', label: 'Item', required: true },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'inStock', label: 'In Stock' },
  { key: 'committed', label: 'Committed' },
  { key: 'available', label: 'Available' },
  { key: 'onOrder', label: 'On Order' },
  { key: 'minMax', label: 'Min / Max' },
  { key: 'incoming', label: 'Incoming' },
  { key: 'price', label: 'Case Price' },
  { key: 'leadTime', label: 'Lead Time' },
];

function getStockBadge(row: InventoryStatusRow): {
  label: string;
  variant: 'success' | 'secondary' | 'warning' | 'destructive';
} {
  if (row.isDiscontinued)
    return { label: 'Discontinued', variant: 'secondary' };
  if (row.qtyAvailable <= 0)
    return { label: 'Out of stock', variant: 'destructive' };
  if (row.minQty > 0 && row.qtyAvailable < row.minQty)
    return { label: 'Low stock', variant: 'warning' };
  return { label: 'In stock', variant: 'success' };
}

export function InventoryStatusTable({
  rows,
  linkItems = true,
  visibleColumns,
}: {
  rows: InventoryStatusRow[];
  linkItems?: boolean;
  visibleColumns?: Set<string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No products match the selected filters.
      </div>
    );
  }

  const show = (key: string) => isColumnVisible(visibleColumns, key);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {show('item') && <TableHead>Item</TableHead>}
          {show('type') && <TableHead>Type</TableHead>}
          {show('status') && <TableHead>Status</TableHead>}
          {show('inStock') && (
            <TableHead className="text-right">In Stock</TableHead>
          )}
          {show('committed') && (
            <TableHead className="text-right">Committed</TableHead>
          )}
          {show('available') && (
            <TableHead className="text-right">Available</TableHead>
          )}
          {show('onOrder') && (
            <TableHead className="text-right">On Order</TableHead>
          )}
          {show('minMax') && (
            <TableHead className="text-right">Min / Max</TableHead>
          )}
          {show('incoming') && <TableHead>Incoming</TableHead>}
          {show('price') && (
            <TableHead className="text-right">Case Price</TableHead>
          )}
          {show('leadTime') && <TableHead>Lead Time</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const status = getStockBadge(r);
          return (
            <TableRow key={r.productId} className="group">
              {show('item') && (
                <TableCell className="font-medium">
                  {linkItems ? (
                    <Link
                      href={`/products/${r.productId}`}
                      className="block group-hover:underline">
                      {r.itemNumber}
                    </Link>
                  ) : (
                    <span>{r.itemNumber}</span>
                  )}
                  <span className="text-muted-foreground line-clamp-1 text-xs">
                    {r.description}
                  </span>
                </TableCell>
              )}
              {show('type') && (
                <TableCell>
                  <span className="text-xs">
                    {r.productType} · {r.unitSoldBy}
                  </span>
                </TableCell>
              )}
              {show('status') && (
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
              )}
              {show('inStock') && (
                <TableCell className="text-right tabular-nums">
                  {r.qtyInStock.toLocaleString()}
                </TableCell>
              )}
              {show('committed') && (
                <TableCell className="text-right tabular-nums">
                  {r.qtyCommitted.toLocaleString()}
                </TableCell>
              )}
              {show('available') && (
                <TableCell className="text-right font-semibold tabular-nums">
                  {r.qtyAvailable.toLocaleString()}
                </TableCell>
              )}
              {show('onOrder') && (
                <TableCell className="text-right tabular-nums">
                  {r.qtyOnOrder.toLocaleString()}
                </TableCell>
              )}
              {show('minMax') && (
                <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                  {r.minQty} / {r.maxQty}
                </TableCell>
              )}
              {show('incoming') && (
                <TableCell className="text-xs">
                  {r.qtyOnOrder > 0 ? (
                    <span className="font-medium tabular-nums">
                      {r.qtyOnOrder.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
              {show('price') && (
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(Number(r.casePrice))}
                </TableCell>
              )}
              {show('leadTime') && (
                <TableCell className="text-xs">{r.leadTime ?? '—'}</TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
