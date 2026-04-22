import { FileText, ListOrdered, ShoppingBasket, Wallet } from 'lucide-react';
import { ReportCard } from '@/features/reports/components/report-card';

const CUSTOMER_REPORT_CARDS = [
  {
    slug: 'customer-listing',
    title: 'Customer Name Listing',
    description:
      'Customers filterable by salesperson, territory, and active status.',
    icon: ListOrdered,
  },
  {
    slug: 'customer-invoices',
    title: 'Customer Invoice Summary',
    description:
      'Invoices and payments per customer, or aggregated across all customers.',
    icon: FileText,
  },
  {
    slug: 'customer-purchases',
    title: 'Customer Purchase History',
    description: 'Quantity and dollars purchased over a selectable period.',
    icon: ShoppingBasket,
  },
  {
    slug: 'aging-summary',
    title: 'Customer Sales & Aging Summary',
    description:
      'Accounts receivable aging with MTD, YTD, and Last 12 Months sales.',
    icon: Wallet,
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
              href={`/reports/customers/${report.slug}`}
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
