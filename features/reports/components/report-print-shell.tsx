'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

interface ReportPrintShellProps {
  title: string;
  subtitle?: ReactNode;
  meta?: { label: string; value: ReactNode }[];
  children: ReactNode;
}

export function ReportPrintShell({
  title,
  subtitle,
  meta,
  children,
}: ReportPrintShellProps) {
  const printedAt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());

  return (
    <>
      {/* Print toolbar — hidden on paper */}
      <div className="sticky top-0 z-10 flex items-center justify-end border-b bg-white px-6 py-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Print Report
        </button>
      </div>

      <div className="report-print mx-auto max-w-[1100px] p-6 print:max-w-none print:p-0">
        <header className="mb-4 flex items-start justify-between border-b border-gray-300 pb-3">
          <div className="flex items-center gap-3">
            <Image
              src="/mtc-logo.webp"
              alt="MTC Trading Co."
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl leading-tight font-bold">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>
              <span className="font-medium">Printed:</span> {printedAt}
            </p>
            {meta?.map((m) => (
              <p key={m.label}>
                <span className="font-medium">{m.label}:</span> {m.value}
              </p>
            ))}
          </div>
        </header>
        {children}
      </div>
    </>
  );
}

/**
 * Compact stat grid for print. Values are right-aligned with small labels.
 */
export function ReportPrintStats({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded border border-gray-200 p-2">
          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            {item.label}
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
