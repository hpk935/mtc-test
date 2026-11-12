import Link from 'next/link';
import { ClickableRow } from '@/components/data/clickable-row';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { REFERENCE_CODE_KIND, referenceCodeEditPath } from '../constants';
import type { ReferenceCodeKind } from '../constants';
import type { ReferenceCodeRecord } from '../types';

interface ReferenceCodeTableProps {
  kind: ReferenceCodeKind;
  codes: ReferenceCodeRecord[];
}

export function ReferenceCodeTable({ kind, codes }: ReferenceCodeTableProps) {
  const config = REFERENCE_CODE_KIND[kind];

  if (codes.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No {config.plural.toLowerCase()} found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Description</TableHead>
          {config.hasNetDays && (
            <TableHead className="text-right">Net Days</TableHead>
          )}
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((record) => {
          const href = referenceCodeEditPath(kind, record.code);
          return (
            <ClickableRow key={record.code} href={href}>
              <TableCell>
                <Link href={href} className="font-mono font-medium">
                  {record.code}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {record.description}
              </TableCell>
              {config.hasNetDays && (
                <TableCell className="text-right tabular-nums">
                  {record.netDays ?? '—'}
                </TableCell>
              )}
              <TableCell>
                <Badge variant={record.isActive ? 'success' : 'destructive'}>
                  {record.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            </ClickableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
