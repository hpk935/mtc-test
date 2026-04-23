'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductResult {
  itemNumber: string;
  description: string;
}

interface ReportItemPickerProps {
  paramName?: string;
  initialItemNumber?: string;
  initialDescription?: string;
  label?: string;
  className?: string;
}

/**
 * URL-driven item-number picker backed by the `/api/products?search=` endpoint.
 * Selecting a product sets `?itemNumber=<code>` on the current URL.
 */
export function ReportItemPicker({
  paramName = 'itemNumber',
  initialItemNumber,
  initialDescription,
  label = 'Item',
  className,
}: ReportItemPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(
    initialItemNumber
      ? `${initialItemNumber}${initialDescription ? ` — ${initialDescription}` : ''}`
      : '',
  );
  const [results, setResults] = useState<ProductResult[]>([]);
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
        `/api/products?search=${encodeURIComponent(q)}&pageSize=10`,
      );
      if (!res.ok) {
        setResults([]);
        return;
      }
      const json = await res.json();
      setResults((json.data?.products ?? []) as ProductResult[]);
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

  function selectProduct(product: ProductResult) {
    setQuery(`${product.itemNumber} — ${product.description}`);
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, product.itemNumber);
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
          placeholder="Search by item # or description..."
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
            <span className="sr-only">Clear item</span>
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
                {results.map((p) => (
                  <li key={p.itemNumber}>
                    <button
                      type="button"
                      onClick={() => selectProduct(p)}
                      className="hover:bg-accent w-full px-3 py-2 text-left text-sm">
                      <span className="block font-medium">{p.itemNumber}</span>
                      <span className="text-muted-foreground line-clamp-1 text-xs">
                        {p.description}
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
