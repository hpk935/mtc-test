'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface SearchResult {
  customerNumber: string;
  customerName: string;
  mainEmail: string;
}

export function DashboardSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/customers?search=${encodeURIComponent(query.trim())}&pageSize=5`,
        );
        if (res.ok) {
          const json = await res.json();
          setResults(json.data?.customers ?? []);
          setIsOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(customerNumber: string) {
    setIsOpen(false);
    setQuery('');
    router.push(`/customers/${customerNumber}`);
  }

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-xl">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="Search for a customer..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="h-12 pl-10 text-base"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="bg-popover border-border absolute top-full z-50 mt-1 w-full rounded-lg border shadow-lg">
          {results.map((r) => (
            <button
              key={r.customerNumber}
              type="button"
              className="hover:bg-accent flex w-full items-center justify-between px-4 py-3 text-left text-sm first:rounded-t-lg last:rounded-b-lg"
              onClick={() => handleSelect(r.customerNumber)}>
              <div>
                <div className="font-medium">{r.customerName}</div>
                <div className="text-muted-foreground text-xs">
                  {r.mainEmail}
                </div>
              </div>
              <span className="text-muted-foreground text-xs">
                {r.customerNumber}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen &&
        query.trim().length >= 2 &&
        results.length === 0 &&
        !isLoading && (
          <div className="bg-popover border-border absolute top-full z-50 mt-1 w-full rounded-lg border p-4 shadow-lg">
            <p className="text-muted-foreground text-center text-sm">
              No customers found.
            </p>
          </div>
        )}

      <p className="text-muted-foreground mt-2 text-center text-sm">
        Don&apos;t remember their name?{' '}
        <Link href="/customers" className="text-primary hover:underline">
          View All Clients
        </Link>
      </p>
    </div>
  );
}
