import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ProductListItem } from '@/features/products/queries';

function formatCurrency(value: string): string {
  return `$${Number(value).toFixed(2)}`;
}

interface ProductTableProps {
  products: ProductListItem[];
}

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        No products found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item Number</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Case Price</TableHead>
          <TableHead className="text-right">In Stock</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.productId} className="cursor-pointer">
            <TableCell className="font-medium">
              <Link
                href={`/products/${product.productId}`}
                className="hover:underline">
                {product.itemNumber}
              </Link>
            </TableCell>
            <TableCell className="max-w-75 truncate">
              {product.description}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(product.casePrice)}
            </TableCell>
            <TableCell className="text-right">
              {product.qtyInStock.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {product.qtyAvailable.toLocaleString()}
            </TableCell>
            <TableCell>
              {product.isDiscontinued ? (
                <Badge variant="destructive">Discontinued</Badge>
              ) : (
                <Badge variant="default">Active</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
