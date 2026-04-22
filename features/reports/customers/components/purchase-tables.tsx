import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  isColumnVisible,
  type ReportColumn,
} from '@/features/reports/components/report-columns';
import type {
  PurchaseHistoryCustomerRow,
  PurchaseHistoryItemRow,
} from '@/features/reports/customers/queries';

export const PURCHASE_ITEMS_COLUMNS: ReportColumn[] = [
  { key: 'itemNumber', label: 'Item #', required: true },
  { key: 'description', label: 'Description' },
  { key: 'qty', label: 'Qty' },
  { key: 'orders', label: 'Orders' },
  { key: 'total', label: 'Total' },
  { key: 'lastPurchase', label: 'Last Purchase' },
];

export const PURCHASE_CUSTOMERS_COLUMNS: ReportColumn[] = [
  { key: 'rank', label: 'Rank #' },
  { key: 'customer', label: 'Customer', required: true },
  { key: 'territory', label: 'Territory' },
  { key: 'salesperson', label: 'Salesperson' },
  { key: 'orders', label: 'Orders' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'qty', label: 'Qty' },
  { key: 'total', label: 'Total' },
  { key: 'lastPurchase', label: 'Last Purchase' },
];

export function PurchaseItemsTable({
  rows,
  visibleColumns,
}: {
  rows: PurchaseHistoryItemRow[];
  visibleColumns?: Set<string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-10 text-sm">
        No purchases in this period.
      </div>
    );
  }

  const show = (key: string) => isColumnVisible(visibleColumns, key);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {show('itemNumber') && <TableHead>Item #</TableHead>}
          {show('description') && <TableHead>Description</TableHead>}
          {show('qty') && <TableHead className="text-right">Qty</TableHead>}
          {show('orders') && (
            <TableHead className="text-right">Orders</TableHead>
          )}
          {show('total') && <TableHead className="text-right">Total</TableHead>}
          {show('lastPurchase') && <TableHead>Last Purchase</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.itemNumber}>
            {show('itemNumber') && (
              <TableCell className="font-mono font-medium">
                <a
                  href={`/products/${encodeURIComponent(r.itemNumber)}`}
                  className="hover:underline">
                  {r.itemNumber}
                </a>
              </TableCell>
            )}
            {show('description') && (
              <TableCell>{r.description ?? '—'}</TableCell>
            )}
            {show('qty') && (
              <TableCell className="text-right tabular-nums">
                {Number(r.totalQty).toLocaleString()}
              </TableCell>
            )}
            {show('orders') && (
              <TableCell className="text-right tabular-nums">
                {r.orderCount}
              </TableCell>
            )}
            {show('total') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.totalAmount))}
              </TableCell>
            )}
            {show('lastPurchase') && (
              <TableCell>
                {r.lastPurchaseDate ? formatDate(r.lastPurchaseDate) : '—'}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PurchaseCustomersTable({
  rows,
  linkCustomers = true,
  visibleColumns,
}: {
  rows: PurchaseHistoryCustomerRow[];
  linkCustomers?: boolean;
  visibleColumns?: Set<string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No customer purchases in this period.
      </div>
    );
  }

  const show = (key: string) => isColumnVisible(visibleColumns, key);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {show('rank') && <TableHead className="w-10">#</TableHead>}
          {show('customer') && <TableHead>Customer</TableHead>}
          {show('territory') && <TableHead>Territory</TableHead>}
          {show('salesperson') && <TableHead>Salesperson</TableHead>}
          {show('orders') && (
            <TableHead className="text-right">Orders</TableHead>
          )}
          {show('invoices') && (
            <TableHead className="text-right">Invoices</TableHead>
          )}
          {show('qty') && <TableHead className="text-right">Qty</TableHead>}
          {show('total') && <TableHead className="text-right">Total</TableHead>}
          {show('lastPurchase') && <TableHead>Last Purchase</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={r.customerNumber}>
            {show('rank') && (
              <TableCell className="text-muted-foreground text-xs tabular-nums">
                {i + 1}
              </TableCell>
            )}
            {show('customer') && (
              <TableCell className="font-medium">
                {linkCustomers ? (
                  <a
                    href={`/reports/customers/customer-purchases?view=per-customer&customerNumber=${encodeURIComponent(r.customerNumber)}`}
                    className="hover:underline">
                    {r.customerName}
                  </a>
                ) : (
                  r.customerName
                )}
                <span className="text-muted-foreground block text-xs">
                  {r.customerNumber}
                </span>
              </TableCell>
            )}
            {show('territory') && <TableCell>{r.territoryCode}</TableCell>}
            {show('salesperson') && <TableCell>{r.salespersonCode}</TableCell>}
            {show('orders') && (
              <TableCell className="text-right tabular-nums">
                {r.orderCount}
              </TableCell>
            )}
            {show('invoices') && (
              <TableCell className="text-right tabular-nums">
                {r.invoiceCount}
              </TableCell>
            )}
            {show('qty') && (
              <TableCell className="text-right tabular-nums">
                {Number(r.totalQty).toLocaleString()}
              </TableCell>
            )}
            {show('total') && (
              <TableCell className="text-right tabular-nums">
                {formatCurrency(Number(r.totalAmount))}
              </TableCell>
            )}
            {show('lastPurchase') && (
              <TableCell>
                {r.lastPurchaseDate ? formatDate(r.lastPurchaseDate) : '—'}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
