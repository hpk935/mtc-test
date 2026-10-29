import Link from 'next/link';
import { ClickableRow } from '@/components/data/clickable-row';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { CustomerListItem } from '@/features/customers/queries';

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

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

interface CustomerTableProps {
  customers: CustomerListItem[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No customers found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Primary Contact</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>City / State</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <ClickableRow
            key={customer.customerNumber}
            href={`/customers/${customer.customerNumber}`}
          >
            <TableCell className="font-medium">
              <Link
                href={`/customers/${customer.customerNumber}`}
                className="block"
              >
                {customer.customerName}
              </Link>
              <span className="text-muted-foreground text-xs">
                {customer.customerNumber}
              </span>
            </TableCell>
            <TableCell>{customer.primaryContactName}</TableCell>
            <TableCell>{customer.mainEmail}</TableCell>
            <TableCell>{formatPhone(customer.mainPhone)}</TableCell>
            <TableCell>
              {customer.billingCity}, {customer.billingStateCode}
            </TableCell>
            <TableCell>
              <Badge
                variant={STATUS_VARIANT[customer.accountStatus] ?? 'secondary'}
              >
                {STATUS_LABEL[customer.accountStatus] ?? customer.accountStatus}
              </Badge>
            </TableCell>
          </ClickableRow>
        ))}
      </TableBody>
    </Table>
  );
}
