import { Suspense } from 'react';
import { DataTablePagination } from '@/components/data/data-table-pagination';
import { DataTableSearch } from '@/components/data/data-table-search';
import { ReportPageShell } from '@/features/reports/components/report-page-shell';
import { ReportStats } from '@/features/reports/components/report-stats';
import { ReportPrintButton } from '@/features/reports/components/report-print-button';
import { ReportSelectFilter } from '@/features/reports/components/report-select-filter';
import { ReportColumnsFilter } from '@/features/reports/components/report-columns-filter';
import { parseVisibleColumns } from '@/features/reports/components/report-columns';
import {
  getDistinctUnitsSoldBy,
  getInventoryStatusReport,
} from '@/features/reports/products/queries';
import {
  STOCK_STATUS_OPTIONS,
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

const STOCK_OPTIONS = STOCK_STATUS_OPTIONS.filter((s) => s !== 'all').map(
  (s) => ({ label: STOCK_LABEL[s], value: s }),
);

export default async function InventoryStatusReportPage({
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

  const [report, unitsSoldBy] = await Promise.all([
    getInventoryStatusReport({
      search: filters.search,
      unitSoldBy: filters.unitSoldBy,
      stockStatus: filters.stockStatus as StockStatus,
      page: filters.page,
    }),
    getDistinctUnitsSoldBy(),
  ]);

  const unitSoldByOptions = unitsSoldBy.map((u) => ({ label: u, value: u }));

  return (
    <ReportPageShell
      title="Inventory Status"
      description="Stock levels across all products with low-stock, out-of-stock, and incoming-shipment visibility.">
      <ReportStats
        items={[
          { label: 'Products', value: report.stats.total.toLocaleString() },
          {
            label: 'In Stock',
            value: report.stats.inStock.toLocaleString(),
          },
          {
            label: 'Low Stock',
            value: report.stats.lowStock.toLocaleString(),
          },
          {
            label: 'Out of Stock',
            value: report.stats.outOfStock.toLocaleString(),
          },
          {
            label: 'Incoming',
            value: report.stats.incoming.toLocaleString(),
          },
          {
            label: 'Stock Value',
            value: formatCurrency(report.stats.stockValue),
            hint: 'At landed cost',
          },
        ]}
        className="xl:grid-cols-6"
      />

      <Suspense fallback={null}>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-muted-foreground mb-1 block text-xs font-medium">
              Search
            </label>
            <DataTableSearch placeholder="Item #, description, UPC..." />
          </div>
          <ReportSelectFilter
            paramName="stockStatus"
            label="Stock Status"
            options={[{ label: 'All', value: 'all' }, ...STOCK_OPTIONS]}
            defaultValue="in_stock"
            includeAll={false}
          />
          <ReportSelectFilter
            paramName="unitSoldBy"
            label="Unit Sold By"
            options={unitSoldByOptions}
            allLabel="All Units"
          />
        </div>
      </Suspense>

      <div className="flex items-center justify-end gap-2">
        <ReportColumnsFilter columns={INVENTORY_STATUS_COLUMNS} />
        <ReportPrintButton path="/reports/products/inventory-status" />
      </div>

      <div className="rounded-lg border">
        <DataTablePagination
          currentPage={report.page}
          totalPages={report.totalPages}
          totalCount={report.totalCount}
          pageSize={report.pageSize}
          label="products"
        />
        <InventoryStatusTable
          rows={report.rows}
          visibleColumns={visibleColumns}
        />
      </div>
    </ReportPageShell>
  );
}
