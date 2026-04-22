export const PERIOD_OPTIONS = ['1m', '3m', '6m', '12m'] as const;
export type PeriodOption = (typeof PERIOD_OPTIONS)[number];

export const PERIOD_LABELS: Record<PeriodOption, string> = {
    '1m': 'Last 1 Month',
    '3m': 'Last 3 Months',
    '6m': 'Last 6 Months',
    '12m': 'Last 12 Months',
};

export const AGING_BUCKETS = [
    'current',
    'd1_30',
    'd31_60',
    'd61_90',
    'd90_plus',
] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

export const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
    current: 'Current',
    d1_30: '1–30',
    d31_60: '31–60',
    d61_90: '61–90',
    d90_plus: '90+',
};

/**
 * Report metadata used by the `/reports` index and the print routes.
 * Add new entries here when Phase 2 reports are introduced.
 */
export const CUSTOMER_REPORTS = [
    {
        slug: 'customer-listing',
        title: 'Customer Name Listing',
        description:
            'List of customers filterable by salesman, territory, and active/inactive status.',
    },
    {
        slug: 'customer-invoices',
        title: 'Customer Invoice Summary',
        description:
            'Invoices and payment history per customer, or aggregated across all customers.',
    },
    {
        slug: 'customer-purchases',
        title: 'Customer Purchase History',
        description:
            'Quantity and dollar amounts purchased by customer over a selectable period.',
    },
    {
        slug: 'aging-summary',
        title: 'Customer Sales & Aging Summary',
        description:
            'Per-customer accounts receivable aging with MTD, YTD, and Last 12 Months sales.',
    },
] as const;

export type CustomerReportSlug = (typeof CUSTOMER_REPORTS)[number]['slug'];
