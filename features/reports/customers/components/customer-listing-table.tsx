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
import { formatDate, formatPhone } from '@/lib/utils';
import {
  isColumnVisible,
  type ReportColumn,
} from '@/features/reports/components/report-columns';
import type { CustomerListingRow } from '../queries';

export const CUSTOMER_LISTING_COLUMNS: ReportColumn[] = [
  { key: 'customer', label: 'Customer', required: true },
  { key: 'contact', label: 'Contact' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'cityState', label: 'City / State' },
  { key: 'territory', label: 'Territory' },
  { key: 'salesperson', label: 'Salesperson' },
  { key: 'status', label: 'Status' },
  { key: 'opened', label: 'Opened' },
  { key: 'lastInvoice', label: 'Last Invoice' },
];

const STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'warning'> = {
  active: 'success',
  inactive: 'secondary',
  on_hold: 'warning',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_hold: 'On Hold',
};

export function CustomerListingTable({
  rows,
  linkCustomers = true,
  visibleColumns,
}: {
  rows: CustomerListingRow[];
  linkCustomers?: boolean;
  visibleColumns?: Set<string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No customers match the selected filters.
      </div>
    );
  }

  const show = (key: string) => isColumnVisible(visibleColumns, key);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {show('customer') && <TableHead>Customer</TableHead>}
          {show('contact') && <TableHead>Contact</TableHead>}
          {show('phone') && <TableHead>Phone</TableHead>}
          {show('email') && <TableHead>Email</TableHead>}
          {show('cityState') && <TableHead>City / State</TableHead>}
          {show('territory') && <TableHead>Territory</TableHead>}
          {show('salesperson') && <TableHead>Salesperson</TableHead>}
          {show('status') && <TableHead>Status</TableHead>}
          {show('opened') && <TableHead>Opened</TableHead>}
          {show('lastInvoice') && <TableHead>Last Invoice</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((c) => (
          <TableRow key={c.customerNumber} className="group">
            {show('customer') && (
              <TableCell className="font-medium">
                {linkCustomers ? (
                  <Link
                    href={`/customers/${c.customerNumber}`}
                    className="block group-hover:underline">
                    {c.customerName}
                  </Link>
                ) : (
                  <span>{c.customerName}</span>
                )}
                <span className="text-muted-foreground text-xs">
                  {c.customerNumber}
                </span>
              </TableCell>
            )}
            {show('contact') && <TableCell>{c.primaryContactName}</TableCell>}
            {show('phone') && <TableCell>{formatPhone(c.mainPhone)}</TableCell>}
            {show('email') && <TableCell>{c.mainEmail}</TableCell>}
            {show('cityState') && (
              <TableCell>
                {c.billingCity}, {c.billingStateCode}
              </TableCell>
            )}
            {show('territory') && <TableCell>{c.territoryCode}</TableCell>}
            {show('salesperson') && (
              <TableCell>{c.salespersonName ?? c.salespersonCode}</TableCell>
            )}
            {show('status') && (
              <TableCell>
                <Badge variant={STATUS_VARIANT[c.accountStatus] ?? 'secondary'}>
                  {STATUS_LABEL[c.accountStatus] ?? c.accountStatus}
                </Badge>
              </TableCell>
            )}
            {show('opened') && (
              <TableCell>
                {c.accountOpenDate ? formatDate(c.accountOpenDate) : '—'}
              </TableCell>
            )}
            {show('lastInvoice') && (
              <TableCell>
                {c.lastInvoiceDate ? formatDate(c.lastInvoiceDate) : '—'}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
