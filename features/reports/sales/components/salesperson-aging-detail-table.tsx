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
import { formatCurrency, formatDate } from '@/lib/utils';
import type { SalespersonAgingGroup } from '@/features/reports/sales/queries';

const STATUS_VARIANT: Record<
  string,
  'success' | 'secondary' | 'warning' | 'destructive'
> = {
  open: 'secondary',
  partially_paid: 'warning',
  paid: 'success',
  voided: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  partially_paid: 'Partial',
  paid: 'Paid',
  voided: 'Voided',
};

function formatPhone(phone: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function SalespersonAgingDetailTable({
  groups,
  linkInvoices = true,
}: {
  groups: SalespersonAgingGroup[];
  linkInvoices?: boolean;
}) {
  if (groups.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No open invoices for this salesperson.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Due</TableHead>
          <TableHead className="text-right">Current</TableHead>
          <TableHead className="text-right">1–30</TableHead>
          <TableHead className="text-right">31–60</TableHead>
          <TableHead className="text-right">61–90</TableHead>
          <TableHead className="text-right">90+</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => (
          <CustomerGroup
            key={group.customerNumber}
            group={group}
            linkInvoices={linkInvoices}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function CustomerGroup({
  group,
  linkInvoices,
}: {
  group: SalespersonAgingGroup;
  linkInvoices: boolean;
}) {
  return (
    <>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableCell colSpan={10} className="py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col">
              <Link
                href={`/customers/${group.customerNumber}`}
                className="text-sm font-semibold hover:underline">
                {group.customerNumber} · {group.customerName}
              </Link>
              <span className="text-muted-foreground text-xs">
                {[
                  group.primaryContactName,
                  formatPhone(group.mainPhone),
                  group.termCode && `Terms: ${group.termCode}`,
                  group.territoryCode && `Territory: ${group.territoryCode}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">
              {group.invoices.length} open
            </span>
          </div>
        </TableCell>
      </TableRow>
      {group.invoices.map((inv) => (
        <TableRow key={inv.invoiceNumber}>
          <TableCell className="font-mono font-medium">
            {linkInvoices ? (
              <Link
                href={`/invoices/${inv.invoiceNumber}`}
                className="hover:underline">
                {inv.invoiceNumber}
              </Link>
            ) : (
              inv.invoiceNumber
            )}
          </TableCell>
          <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
          <TableCell>
            {inv.dueDate ? (
              <>
                {formatDate(inv.dueDate)}
                {inv.daysPastDue > 0 && (
                  <span className="text-destructive ml-1 text-xs">
                    ({inv.daysPastDue}d)
                  </span>
                )}
              </>
            ) : (
              '—'
            )}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {inv.current ? formatCurrency(inv.current) : ''}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {inv.d1_30 ? formatCurrency(inv.d1_30) : ''}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {inv.d31_60 ? formatCurrency(inv.d31_60) : ''}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {inv.d61_90 ? formatCurrency(inv.d61_90) : ''}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {inv.d90_plus ? formatCurrency(inv.d90_plus) : ''}
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            {formatCurrency(Number(inv.balanceDue))}
          </TableCell>
          <TableCell>
            <Badge variant={STATUS_VARIANT[inv.invoiceStatus] ?? 'secondary'}>
              {STATUS_LABEL[inv.invoiceStatus] ?? inv.invoiceStatus}
            </Badge>
          </TableCell>
        </TableRow>
      ))}
      <TableRow className="border-t-2">
        <TableCell colSpan={3} className="text-right text-xs font-medium">
          Customer subtotal
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums">
          {group.current ? formatCurrency(group.current) : ''}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums">
          {group.d1_30 ? formatCurrency(group.d1_30) : ''}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums">
          {group.d31_60 ? formatCurrency(group.d31_60) : ''}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums">
          {group.d61_90 ? formatCurrency(group.d61_90) : ''}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums">
          {group.d90_plus ? formatCurrency(group.d90_plus) : ''}
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums">
          {formatCurrency(group.balanceDue)}
        </TableCell>
        <TableCell />
      </TableRow>
    </>
  );
}
