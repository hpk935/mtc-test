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
import { VENDOR_TYPE_LABEL } from '../constants';
import type { VendorListItem } from '../queries';

function formatPhone(phone: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function VendorTable({ vendors }: { vendors: VendorListItem[] }) {
  if (vendors.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No vendors found.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((v) => (
          <ClickableRow key={v.id} href={`/vendors/${v.id}`}>
            <TableCell className="font-medium">
              <Link href={`/vendors/${v.id}`} className="block">
                {v.name}
              </Link>
              <span className="text-muted-foreground text-xs">
                {v.vendorCode}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                {VENDOR_TYPE_LABEL[v.vendorType]}
              </Badge>
            </TableCell>
            <TableCell>{v.contactName ?? '—'}</TableCell>
            <TableCell>{formatPhone(v.phone) || '—'}</TableCell>
            <TableCell>
              {v.city || v.state
                ? `${v.city ?? ''}${v.city && v.state ? ', ' : ''}${v.state ?? ''}`
                : '—'}
            </TableCell>
            <TableCell>
              <Badge variant={v.isActive ? 'success' : 'secondary'}>
                {v.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
          </ClickableRow>
        ))}
      </TableBody>
    </Table>
  );
}
