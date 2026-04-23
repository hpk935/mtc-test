import {
  FileText,
  ListOrdered,
  Package,
  PackageSearch,
  ShoppingBasket,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { ReportCard } from '@/features/reports/components/report-card';

const CUSTOMER_REPORT_CARDS = [
  {
    slug: 'customers/customer-listing',
    title: 'Customer Name Listing',
    description:
      'Customers filterable by salesperson, territory, and active status.',
    icon: ListOrdered,
  },
  {
    slug: 'customers/customer-invoices',
    title: 'Customer Invoice Summary',
    description:
      'Invoices and payments per customer, or aggregated across all customers.',
    icon: FileText,
  },
  {
    slug: 'customers/customer-purchases',
    title: 'Customer Purchase History',
    description: 'Quantity and dollars purchased over a selectable period.',
    icon: ShoppingBasket,
  },
  {
    slug: 'customers/aging-summary',
    title: 'Customer Sales & Aging Summary',
    description:
      'Accounts receivable aging with MTD, YTD, and Last 12 Months sales.',
    icon: Wallet,
  },
] as const;

const SALES_REPORT_CARDS = [
  {
    slug: 'sales/aging-by-salesperson',
    title: 'Aging Report by Salesperson',
    description: 'AR aging buckets and sales totals rolled up per salesperson.',
    icon: UsersRound,
  },
] as const;

const PRODUCT_REPORT_CARDS = [
  {
    slug: 'products/inventory-status',
    title: 'Inventory Status Report',
    description:
      'Stock levels with low-stock, out-of-stock, and incoming-shipment visibility.',
    icon: Package,
  },
  {
    slug: 'products/item-invoice-history',
    title: 'Item Invoice History Lookup',
    description:
      'All invoices that included a given item over a selectable period.',
    icon: PackageSearch,
  },
] as const;

export default function ReportsIndexPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Business health and operational reports.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Customer Reports
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {CUSTOMER_REPORT_CARDS.map((report) => (
            <ReportCard
              key={report.slug}
              href={`/reports/${report.slug}`}
              title={report.title}
              description={report.description}
              icon={report.icon}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Sales Reports
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {SALES_REPORT_CARDS.map((report) => (
            <ReportCard
              key={report.slug}
              href={`/reports/${report.slug}`}
              title={report.title}
              description={report.description}
              icon={report.icon}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Product Reports
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {PRODUCT_REPORT_CARDS.map((report) => (
            <ReportCard
              key={report.slug}
              href={`/reports/${report.slug}`}
              title={report.title}
              description={report.description}
              icon={report.icon}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
