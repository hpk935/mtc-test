import {
  ReportPrintShell,
  ReportPrintStats,
} from '@/features/reports/components/report-print-shell';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import { getInventoryStatusReport } from '@/features/reports/products/queries';
import {
  inventoryStatusFiltersSchema,
  type StockStatus,
} from '@/features/reports/products/validation';
import {
  INVENTORY_STATUS_COLUMNS,
  InventoryStatusTable,
} from '@/features/reports/products/components/inventory-status-table';
import { formatCurrency } from '@/lib/utils';

const STOCK_LABEL: Record<StockStatus, string> = {
  all: 'All',
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  discontinued: 'Discontinued',
  incoming: 'Incoming',
};

export default async function InventoryStatusPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const filters = inventoryStatusFiltersSchema.parse(raw);
  const visibleColumns = parseVisibleColumns(
    raw.cols,
    INVENTORY_STATUS_COLUMNS,
  );
  const data = await getInventoryStatusReport({
    search: filters.search,
    unitSoldBy: filters.unitSoldBy,
    stockStatus: filters.stockStatus as StockStatus,
    page: 1,
    pageSize: 10_000,
  });

  return (
    <ReportPrintShell
      title="Inventory Status"
      subtitle={`${data.stats.total.toLocaleString()} products`}
      meta={
        [
          filters.search && { label: 'Search', value: filters.search },
          filters.unitSoldBy && {
            label: 'Unit',
            value: filters.unitSoldBy,
          },
          filters.stockStatus && {
            label: 'Status',
            value: STOCK_LABEL[filters.stockStatus as StockStatus],
          },
        ].filter(Boolean) as { label: string; value: string }[]
      }>
      <ReportPrintStats
        items={[
          { label: 'In Stock', value: data.stats.inStock.toLocaleString() },
          { label: 'Low', value: data.stats.lowStock.toLocaleString() },
          { label: 'Out', value: data.stats.outOfStock.toLocaleString() },
          {
            label: 'Discontinued',
            value: data.stats.discontinued.toLocaleString(),
          },
          { label: 'Incoming', value: data.stats.incoming.toLocaleString() },
          {
            label: 'Stock Value',
            value: formatCurrency(data.stats.stockValue),
          },
        ]}
      />
      <InventoryStatusTable
        rows={data.rows}
        linkItems={false}
        visibleColumns={visibleColumns}
      />
    </ReportPrintShell>
  );
}
