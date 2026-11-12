'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildWebOrderCsv, webOrderCsvFilename } from '../order-csv';
import type { WebOrder } from '../types';

export function ExportWebOrderButton({ order }: { order: WebOrder }) {
  function handleExport() {
    const csv = buildWebOrderCsv(order);
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = webOrderCsvFilename(order);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport}>
      <Download className="mr-2 size-4" />
      Export CSV
    </Button>
  );
}
