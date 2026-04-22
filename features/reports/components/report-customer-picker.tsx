'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CustomerResult {
  customerNumber: string;
  customerName: string;
}

interface ReportCustomerPickerProps {
  paramName?: string;
  initialCustomerNumber?: string;
  initialCustomerName?: string;
  label?: string;
  className?: string;
}

/**
 * URL-driven customer picker that reuses the existing `/api/customers?search=`
 * endpoint. Selecting a customer sets `?customerNumber=<id>` on the current URL.
 */
export function ReportCustomerPicker({
  paramName = 'customerNumber',
  initialCustomerNumber,
  initialCustomerName,
  label = 'Customer',
  className,
}: ReportCustomerPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(
    initialCustomerName && initialCustomerNumber
      ? `${initialCustomerName} (${initialCustomerNumber})`
      : '',
  );
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/customers?search=${encodeURIComponent(q)}&pageSize=10`,
      );
      if (!res.ok) {
        setResults([]);
        return;
      }
      const json = await res.json();
      setResults((json.data?.customers ?? []) as CustomerResult[]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  }

  function selectCustomer(customer: CustomerResult) {
    setQuery(`${customer.customerName} (${customer.customerNumber})`);
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, customer.customerNumber);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setQuery('');
    setResults([]);
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramName);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={className}>
      <label className="text-muted-foreground mb-1 block text-xs font-medium">
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={handleInput}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search by name or customer #..."
          className="pr-9 pl-9"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={clear}
            className="absolute top-1/2 right-1 -translate-y-1/2">
            <X className="size-3" />
            <span className="sr-only">Clear customer</span>
          </Button>
        )}
        {open && (results.length > 0 || loading) && (
          <div className="bg-popover absolute z-20 mt-1 w-full overflow-hidden rounded-md border shadow-md">
            {loading ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                Searching…
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {results.map((c) => (
                  <li key={c.customerNumber}>
                    <button
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="hover:bg-accent w-full px-3 py-2 text-left text-sm">
                      <span className="block font-medium">
                        {c.customerName}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {c.customerNumber}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
