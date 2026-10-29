'use client';

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { Check, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { createPurchaseOrder, updatePurchaseOrderDraft } from '../actions';
import type { ActionResult } from '@/types';

type VendorOption = { id: number; vendorCode: string; name: string };

function OptionalTag() {
  return (
    <span className="text-muted-foreground ml-1 text-xs font-normal">
      (optional)
    </span>
  );
}

type ProductResult = {
  productId: number;
  itemNumber: string;
  description: string;
  landedCost: string;
};

type Line = {
  key: string;
  productId: number;
  itemNumber: string;
  description: string;
  qtyOrdered: number;
  unitCost: string;
};

type ExistingItem = {
  productId: number;
  itemNumber: string;
  description: string;
  qtyOrdered: number;
  unitCost: string;
};

type ExistingPO = {
  id: number;
  vendorId: number;
  orderDate: string;
  expectedDate: string | null;
  freightAmount: string;
  notes: string | null;
  items: ExistingItem[];
};

export function PurchaseOrderForm({
  vendors,
  purchaseOrder,
  defaultVendorId,
  mode = 'create',
}: {
  vendors: VendorOption[];
  purchaseOrder?: ExistingPO;
  defaultVendorId?: number;
  mode?: 'create' | 'edit';
}) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);

  const [vendorId, setVendorId] = useState(
    purchaseOrder?.vendorId
      ? String(purchaseOrder.vendorId)
      : defaultVendorId
        ? String(defaultVendorId)
        : '',
  );
  const [orderDate, setOrderDate] = useState(purchaseOrder?.orderDate ?? today);
  const [expectedDate, setExpectedDate] = useState(
    purchaseOrder?.expectedDate ?? '',
  );
  const [freightAmount, setFreightAmount] = useState(
    purchaseOrder?.freightAmount ?? '',
  );
  const [notes, setNotes] = useState(purchaseOrder?.notes ?? '');

  const [lines, setLines] = useState<Line[]>(
    purchaseOrder
      ? purchaseOrder.items.map((i, idx) => ({
          key: `existing-${idx}`,
          productId: i.productId,
          itemNumber: i.itemNumber,
          description: i.description,
          qtyOrdered: i.qtyOrdered,
          unitCost: i.unitCost,
        }))
      : [],
  );

  // Product search
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<number | null>(null);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    if (searchRef.current) window.clearTimeout(searchRef.current);
    searchRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(search.trim())}&pageSize=10`,
        );
        const json = await res.json();
        if (json.success) {
          setResults(
            (json.data.products as Array<Record<string, unknown>>).map((p) => ({
              productId: Number(p.productId),
              itemNumber: String(p.itemNumber),
              description: String(p.description),
              landedCost: String(
                (p as { landedCost?: string }).landedCost ?? '0',
              ),
            })),
          );
        }
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (searchRef.current) window.clearTimeout(searchRef.current);
    };
  }, [search]);

  const addLine = useCallback((p: ProductResult) => {
    setLines((prev) => {
      if (prev.some((l) => l.productId === p.productId)) return prev;
      return [
        ...prev,
        {
          key: `new-${Date.now()}-${p.productId}`,
          productId: p.productId,
          itemNumber: p.itemNumber,
          description: p.description,
          qtyOrdered: 0,
          unitCost: Number(p.landedCost) > 0 ? p.landedCost : '',
        },
      ];
    });
    setSearch('');
    setResults([]);
  }, []);

  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l.key !== key));

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );

  const subtotal = lines.reduce(
    (s, l) => s + l.qtyOrdered * Number(l.unitCost || 0),
    0,
  );
  const total = subtotal + Number(freightAmount || 0);

  async function onSubmit(
    _: ActionResult<unknown> | null,
  ): Promise<ActionResult<unknown> | null> {
    if (!vendorId) {
      toast.error('Please select a vendor.');
      return null;
    }
    if (lines.length === 0) {
      toast.error('Add at least one line item.');
      return null;
    }
    for (const l of lines) {
      if (l.qtyOrdered <= 0) {
        toast.error(`Qty must be > 0 for ${l.itemNumber}.`);
        return null;
      }
      const cost = Number(l.unitCost);
      if (!l.unitCost || Number.isNaN(cost) || cost <= 0) {
        toast.error(`Unit cost is required for ${l.itemNumber}.`);
        return null;
      }
    }

    const payload = {
      vendorId,
      orderDate,
      expectedDate: expectedDate || undefined,
      freightAmount,
      notes: notes || undefined,
      items: lines.map((l) => ({
        productId: l.productId,
        qtyOrdered: l.qtyOrdered,
        unitCost: l.unitCost || '0',
      })),
    };

    const result =
      isEdit && purchaseOrder
        ? await updatePurchaseOrderDraft(purchaseOrder.id, payload)
        : await createPurchaseOrder(payload);

    if (result.success) {
      toast.success(
        isEdit ? 'Purchase order updated.' : 'Purchase order created.',
      );
      const id =
        isEdit && purchaseOrder
          ? purchaseOrder.id
          : (result as { data: { id: number } }).data.id;
      window.location.href = `/purchase-orders/${id}`;
    } else {
      toast.error(result.error);
    }
    return result;
  }

  const [, formAction, pending] = useActionState<
    ActionResult<unknown> | null,
    FormData
  >((state) => onSubmit(state), null);

  return (
    <form action={formAction} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Vendor</Label>
          <VendorSearchPicker
            vendors={vendors}
            value={vendorId}
            onChange={setVendorId}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orderDate">Order Date</Label>
            <DatePicker
              id="orderDate"
              value={orderDate}
              onChange={setOrderDate}
              aria-label="Order Date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedDate">
              Expected Date <OptionalTag />
            </Label>
            <DatePicker
              id="expectedDate"
              value={expectedDate}
              onChange={setExpectedDate}
              aria-label="Expected Date"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Line Items</h3>
        </div>

        <div className="relative">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by item # or description…"
              className="pl-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2">
                <X className="size-4" />
              </button>
            )}
          </div>
          {results.length > 0 && (
            <div className="bg-popover absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border shadow-md">
              {results.map((p) => (
                <button
                  type="button"
                  key={p.productId}
                  onClick={() => addLine(p)}
                  className="hover:bg-accent flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm">
                  <div>
                    <div className="font-medium">{p.itemNumber}</div>
                    <div className="text-muted-foreground text-xs">
                      {p.description}
                    </div>
                  </div>
                  <Plus className="text-muted-foreground size-4" />
                </button>
              ))}
            </div>
          )}
          {searching && (
            <div className="text-muted-foreground mt-1 text-xs">Searching…</div>
          )}
        </div>

        {lines.length === 0 ? (
          <div className="text-muted-foreground rounded-md border border-dashed py-8 text-center text-sm">
            No line items. Search and add products above.
          </div>
        ) : (
          <div className="space-y-2">
            {lines.map((l) => (
              <div
                key={l.key}
                className="grid grid-cols-1 items-start gap-3 rounded-md border p-3 sm:grid-cols-[1fr_100px_120px_120px_auto]">
                <div>
                  <div className="text-sm font-medium">{l.itemNumber}</div>
                  <div className="text-muted-foreground line-clamp-1 text-xs">
                    {l.description}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    placeholder="0"
                    value={l.qtyOrdered === 0 ? '' : l.qtyOrdered}
                    onChange={(e) => {
                      // Strip everything but digits, then coerce.
                      const digits = e.target.value.replace(/\D/g, '');
                      updateLine(l.key, {
                        qtyOrdered: digits ? Number(digits) : 0,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit Cost</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    required
                    value={Number(l.unitCost) === 0 ? '' : l.unitCost}
                    onChange={(e) => {
                      // Allow digits and a single decimal point.
                      let v = e.target.value.replace(/[^\d.]/g, '');
                      const firstDot = v.indexOf('.');
                      if (firstDot !== -1) {
                        v =
                          v.slice(0, firstDot + 1) +
                          v.slice(firstDot + 1).replace(/\./g, '');
                      }
                      updateLine(l.key, { unitCost: v });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Line Total</Label>
                  <div className="pt-2 text-sm tabular-nums">
                    {formatCurrency(l.qtyOrdered * Number(l.unitCost || 0))}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(l.key)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="notes">
            Notes <OptionalTag />
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Internal notes for this purchase order"
          />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="freightAmount">
              Freight <OptionalTag />
            </Label>
            <Input
              id="freightAmount"
              inputMode="decimal"
              placeholder="0.00"
              value={freightAmount}
              onChange={(e) => {
                // Allow digits and a single decimal point.
                let v = e.target.value.replace(/[^\d.]/g, '');
                const firstDot = v.indexOf('.');
                if (firstDot !== -1) {
                  v =
                    v.slice(0, firstDot + 1) +
                    v.slice(firstDot + 1).replace(/\./g, '');
                }
                setFreightAmount(v);
              }}
            />
          </div>
          <div className="border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Freight</span>
              <span className="tabular-nums">
                {formatCurrency(Number(freightAmount || 0))}
              </span>
            </div>
            <div className="mt-1 flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" asChild>
          <Link
            href={
              isEdit && purchaseOrder
                ? `/purchase-orders/${purchaseOrder.id}`
                : '/purchase-orders'
            }>
            Cancel
          </Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? 'Saving…'
            : isEdit
              ? 'Save Changes'
              : 'Create Purchase Order'}
        </Button>
      </div>
    </form>
  );
}

function VendorSearchPicker({
  vendors,
  value,
  onChange,
}: {
  vendors: VendorOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = useMemo(
    () => vendors.find((v) => String(v.id) === value) ?? null,
    [vendors, value],
  );

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors.slice(0, 50);
    return vendors
      .filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.vendorCode.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [query, vendors]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <div>
          <div className="text-sm font-medium">{selected.name}</div>
          <div className="text-muted-foreground text-xs">
            {selected.vendorCode}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange('');
            setQuery('');
            setOpen(false);
          }}>
          <X className="mr-1 size-4" />
          Change
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search vendors by name or code…"
          className="pl-9"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="bg-popover absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border shadow-md">
          {filtered.map((v) => (
            <button
              type="button"
              key={v.id}
              onClick={() => {
                onChange(String(v.id));
                setOpen(false);
                setQuery('');
              }}
              className="hover:bg-accent flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm">
              <div>
                <div className="font-medium">{v.name}</div>
                <div className="text-muted-foreground text-xs">
                  {v.vendorCode}
                </div>
              </div>
              <Check className="text-muted-foreground size-4 opacity-0" />
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="bg-popover absolute z-10 mt-1 w-full rounded-md border p-3 text-sm shadow-md">
          <span className="text-muted-foreground">No vendors match.</span>
        </div>
      )}
    </div>
  );
}
