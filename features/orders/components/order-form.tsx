'use client';

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { todayIso } from '@/lib/dates';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ReferenceCodeSelect } from '@/features/reference-codes/components/reference-code-select';
import type { ReferenceCodeOption } from '@/features/reference-codes/types';
import { formatDate } from '@/lib/utils';
import { createOrder, updateOrder } from '../actions';
import type { LastPricePaid } from '../queries';
import type { ActionResult } from '@/types';
import { bestProductMatchIndex } from '@/lib/product-search';

// --- Types ---

interface Salesperson {
  employeeId: string;
  firstName: string;
  lastName: string;
}

interface ShipToAddress {
  shipToId: string;
  locationName: string;
  address1: string;
  address2: string | null;
  city: string;
  stateCode: string;
  postalCode: string;
  isFavorite: boolean;
}

interface CustomerResult {
  customerNumber: string;
  customerName: string;
  primaryContactName: string | null;
  mainEmail: string;
}

interface ProductResult {
  itemNumber: string;
  description: string;
  casePrice: string;
  minimumPackPrice: string;
  caseWeight: string;
  maxQty: number;
  qtyAvailable: number;
}

async function fetchOrderProducts(
  query: string,
): Promise<ProductResult[] | null> {
  const res = await fetch(
    `/api/products?search=${encodeURIComponent(query)}&pageSize=8`,
  );
  if (!res.ok) return null;
  const json = await res.json();
  return (json.data?.products ?? []) as ProductResult[];
}

interface LineItem {
  key: string;
  itemNumber: string;
  description: string;
  qtyOrdered: number;
  unitPrice: number;
  discount: number;
  qtyAvailable: number | null;
  innerCasePrice: number | null;
  unitWeight: number | null;
}

interface CustomerInfo {
  customerNumber: string;
  customerName: string;
  termCode: string;
  territoryCode: string;
  salespersonCode: string;
  defaultFreightTerm: string;
}

// Last price paid per item for one customer. null = the customer has never
// bought the item; a missing key = not looked up yet.
interface LastPrices {
  customerNumber: string | null;
  byItem: Record<string, LastPricePaid | null>;
}

// --- Helpers ---

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function OptionalTag() {
  return (
    <span className="text-muted-foreground ml-1 text-xs font-normal">
      (optional)
    </span>
  );
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function lineTotal(item: LineItem): number {
  const effectivePrice = item.discount > 0 ? item.discount : item.unitPrice;
  return Math.max(0, Math.round(item.qtyOrdered * effectivePrice * 100) / 100);
}

function generateKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

// --- Debounced search hook ---

function useDebouncedSearch<T>(
  fetchFn: (query: string) => Promise<T[]>,
  delay = 300,
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const suppressRef = useRef(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await fetchFn(query.trim());
        setResults(data);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    }, delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchFn, delay]);

  const close = useCallback(() => setIsOpen(false), []);
  const reset = useCallback(() => {
    suppressRef.current = true;
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, []);
  const setDisplayValue = useCallback((value: string) => {
    suppressRef.current = true;
    setQuery(value);
    setResults([]);
    setIsOpen(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    isOpen,
    isLoading,
    close,
    reset,
    setDisplayValue,
  };
}

// --- Props ---

interface OrderFormInitialData {
  customerNumber: string;
  customerName: string;
  salespersonCode: string;
  orderDate: string;
  customerPoReference: string | null;
  freightTerm: string;
  shipToId: string;
  termCode: string;
  territoryCode: string;
  freightAmount: string;
  salesTaxAmount: string;
  shippingNote: string | null;
  lineItems: {
    itemNumber: string;
    description: string | null;
    qtyOrdered: number;
    unitPrice: string;
    discount: string;
    caseWeight: string | null;
    maxQty: number | null;
  }[];
}

interface OrderFormProps {
  salespersons: Salesperson[];
  termOptions: ReferenceCodeOption[];
  territoryOptions: ReferenceCodeOption[];
  freightTerms: readonly string[];
  orderNumber?: string;
  initialData?: OrderFormInitialData;
}

const initialState: ActionResult = { success: false, error: '' };

// --- Component ---

export function OrderForm({
  salespersons,
  termOptions,
  territoryOptions,
  freightTerms,
  orderNumber,
  initialData,
}: OrderFormProps) {
  const isEdit = !!orderNumber && !!initialData;

  const action = isEdit ? updateOrder.bind(null, orderNumber) : createOrder;

  const [state, formAction, pending] = useActionState(action, initialState);
  const today = todayIso();

  // --- Customer state ---
  const [customer, setCustomer] = useState<CustomerInfo | null>(
    initialData
      ? {
          customerNumber: initialData.customerNumber,
          customerName: initialData.customerName,
          termCode: initialData.termCode,
          territoryCode: initialData.territoryCode,
          salespersonCode: initialData.salespersonCode,
          defaultFreightTerm: initialData.freightTerm,
        }
      : null,
  );
  const [shipToId, setShipToId] = useState(initialData?.shipToId ?? '');
  const [selectedShipTo, setSelectedShipTo] = useState<ShipToAddress | null>(
    null,
  );
  const [shipToQuery, setShipToQuery] = useState('');
  const [shipToResults, setShipToResults] = useState<ShipToAddress[]>([]);
  const [shipToOpen, setShipToOpen] = useState(false);
  const [shipToTotal, setShipToTotal] = useState(0);
  const [shipToPage, setShipToPage] = useState(1);
  const [shipToTotalPages, setShipToTotalPages] = useState(0);
  const [shipToFilteredTotal, setShipToFilteredTotal] = useState(0);
  const [shipToLoading, setShipToLoading] = useState(false);
  const [shipToFavoritesOnly, setShipToFavoritesOnly] = useState(false);
  const shipToDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const shipToContainerRef = useRef<HTMLDivElement>(null);

  // --- Order header state ---
  const [salespersonCode, setSalespersonCode] = useState(
    initialData?.salespersonCode ?? '',
  );
  const [orderDate, setOrderDate] = useState(initialData?.orderDate ?? today);
  const [customerPoReference, setCustomerPoReference] = useState(
    initialData?.customerPoReference ?? '',
  );
  const [freightTerm, setFreightTerm] = useState(
    initialData?.freightTerm ?? '',
  );
  const [termCode, setTermCode] = useState(initialData?.termCode ?? '');
  const [territoryCode, setTerritoryCode] = useState(
    initialData?.territoryCode ?? '',
  );
  const [freightAmount, setFreightAmount] = useState(
    initialData?.freightAmount ?? '',
  );
  const [salesTaxAmount, setSalesTaxAmount] = useState(
    initialData?.salesTaxAmount ?? '',
  );
  const [shippingNote, setShippingNote] = useState(
    initialData?.shippingNote ?? '',
  );

  // --- Line items state ---
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (initialData?.lineItems?.length) {
      return initialData.lineItems.map((li) => ({
        key: generateKey(),
        itemNumber: li.itemNumber,
        description: li.description ?? '',
        qtyOrdered: li.qtyOrdered,
        unitPrice: Number(li.unitPrice),
        discount: Number(li.discount),
        qtyAvailable: null,
        innerCasePrice: null,
        unitWeight:
          li.caseWeight != null && li.maxQty
            ? Number(li.caseWeight) / li.maxQty
            : null,
      }));
    }
    return [
      {
        key: generateKey(),
        itemNumber: '',
        description: '',
        qtyOrdered: 1,
        unitPrice: 0,
        discount: 0,
        qtyAvailable: null,
        innerCasePrice: null,
        unitWeight: null,
      },
    ];
  });

  // --- Last price paid (reference for pricing each line) ---
  const lastPriceCustomer = customer?.customerNumber ?? null;
  const selectedItemsKey = [
    ...new Set(lineItems.map((li) => li.itemNumber).filter(Boolean)),
  ]
    .sort()
    .join('\n');
  const [lastPrices, setLastPrices] = useState<LastPrices>({
    customerNumber: null,
    byItem: {},
  });

  useEffect(() => {
    if (!lastPriceCustomer || !selectedItemsKey) return;
    const known =
      lastPrices.customerNumber === lastPriceCustomer ? lastPrices.byItem : {};
    const missing = selectedItemsKey
      .split('\n')
      .filter((itemNumber) => !(itemNumber in known));
    if (missing.length === 0) return;

    let cancelled = false;
    const params = new URLSearchParams();
    for (const itemNumber of missing) params.append('items', itemNumber);
    fetch(
      `/api/customers/${encodeURIComponent(lastPriceCustomer)}/last-prices?${params}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.data) return;
        const found = new Map(
          (json.data as LastPricePaid[]).map((r) => [r.itemNumber, r]),
        );
        setLastPrices((prev) => {
          const byItem =
            prev.customerNumber === lastPriceCustomer ? { ...prev.byItem } : {};
          for (const itemNumber of missing) {
            byItem[itemNumber] = found.get(itemNumber) ?? null;
          }
          return { customerNumber: lastPriceCustomer, byItem };
        });
      });
    return () => {
      cancelled = true;
    };
  }, [lastPriceCustomer, selectedItemsKey, lastPrices]);

  function lastPriceFor(itemNumber: string) {
    if (!itemNumber || lastPrices.customerNumber !== lastPriceCustomer) {
      return undefined;
    }
    return lastPrices.byItem[itemNumber];
  }

  // Load selected ship-to address for edit mode on mount
  useEffect(() => {
    if (!initialData?.shipToId || !initialData?.customerNumber) return;
    fetch(
      `/api/customers/${encodeURIComponent(initialData.customerNumber)}/ship-to?pageSize=100`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          const match = (json.data as ShipToAddress[]).find(
            (a) => a.shipToId === initialData.shipToId,
          );
          if (match) setSelectedShipTo(match);
          setShipToTotal(json.total ?? 0);
        }
      });
  }, [initialData]);

  // --- Customer search ---
  const fetchCustomers = useCallback(async (q: string) => {
    const res = await fetch(
      `/api/customers?search=${encodeURIComponent(q)}&pageSize=8`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.customers ?? []) as CustomerResult[];
  }, []);

  const customerSearch = useDebouncedSearch(fetchCustomers);
  const customerContainerRef = useRef<HTMLDivElement>(null);

  // Set initial display value for edit mode
  useEffect(() => {
    if (initialData) {
      customerSearch.setDisplayValue(
        `${initialData.customerName} (${initialData.customerNumber})`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        customerContainerRef.current &&
        !customerContainerRef.current.contains(e.target as Node)
      ) {
        customerSearch.close();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [customerSearch]);

  async function selectCustomer(customerNumber: string) {
    customerSearch.close();
    // Fetch full customer details + ship-to addresses
    const [custRes, shipRes] = await Promise.all([
      fetch(`/api/customers/${encodeURIComponent(customerNumber)}`),
      fetch(`/api/customers/${encodeURIComponent(customerNumber)}/ship-to`),
    ]);

    if (custRes.ok) {
      const json = await custRes.json();
      const c = json.data;
      if (c) {
        const info: CustomerInfo = {
          customerNumber: c.customerNumber,
          customerName: c.customerName,
          termCode: c.termCode ?? '',
          territoryCode: c.territoryCode ?? '',
          salespersonCode: c.salespersonCode ?? '',
          defaultFreightTerm: c.defaultFreightTerm ?? '',
        };
        setCustomer(info);
        customerSearch.setDisplayValue(
          `${c.customerName} (${c.customerNumber})`,
        );
        // Auto-fill from customer defaults
        if (info.salespersonCode) setSalespersonCode(info.salespersonCode);
        // A retired customer default can't be used here, so staff choose instead.
        setTermCode(
          termOptions.some((o) => o.code === info.termCode)
            ? info.termCode
            : '',
        );
        setTerritoryCode(
          territoryOptions.some((o) => o.code === info.territoryCode)
            ? info.territoryCode
            : '',
        );
        if (info.defaultFreightTerm) setFreightTerm(info.defaultFreightTerm);
      }
    }

    if (shipRes.ok) {
      const json = await shipRes.json();
      const total = json.total ?? 0;
      setShipToTotal(total);
      const addresses = (json.data ?? []) as ShipToAddress[];
      // Auto-select if only one address total
      if (total === 1 && addresses.length === 1) {
        setShipToId(addresses[0].shipToId);
        setSelectedShipTo(addresses[0]);
      } else {
        setShipToId('');
        setSelectedShipTo(null);
      }
    }
  }

  function clearCustomer() {
    setCustomer(null);
    setShipToId('');
    setSelectedShipTo(null);
    setShipToQuery('');
    setShipToResults([]);
    setShipToOpen(false);
    setShipToTotal(0);
    setShipToPage(1);
    setShipToTotalPages(0);
    setShipToFilteredTotal(0);
    setShipToFavoritesOnly(false);
    setSalespersonCode('');
    setTermCode('');
    setTerritoryCode('');
    setFreightTerm('');
    customerSearch.reset();
  }

  // --- Line item handlers ---
  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      {
        key: generateKey(),
        itemNumber: '',
        description: '',
        qtyOrdered: 1,
        unitPrice: 0,
        discount: 0,
        qtyAvailable: null,
        innerCasePrice: null,
        unitWeight: null,
      },
    ]);
  }

  function removeLineItem(key: string) {
    setLineItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.key !== key);
    });
  }

  function updateLineItem(
    key: string,
    field: keyof LineItem,
    value: string | number,
  ) {
    setLineItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    );
  }

  // --- Ship-to search ---
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        shipToContainerRef.current &&
        !shipToContainerRef.current.contains(e.target as Node)
      ) {
        setShipToOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function fetchShipToAddresses(
    search?: string,
    page = 1,
    favoritesOnly = shipToFavoritesOnly,
  ) {
    if (!customer) return;
    setShipToLoading(true);
    const params = new URLSearchParams({ pageSize: '20', page: String(page) });
    if (search && search.trim().length > 0) {
      params.set('search', search.trim());
    }
    if (favoritesOnly) {
      params.set('favoritesOnly', 'true');
    }
    fetch(
      `/api/customers/${encodeURIComponent(customer.customerNumber)}/ship-to?${params}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setShipToResults(json.data as ShipToAddress[]);
          setShipToTotal(json.total ?? 0);
          setShipToFilteredTotal(json.filteredTotal ?? 0);
          setShipToTotalPages(json.totalPages ?? 0);
          setShipToPage(json.page ?? 1);
          setShipToOpen(true);
        }
      })
      .finally(() => setShipToLoading(false));
  }

  function handleShipToSearch(value: string) {
    setShipToQuery(value);
    setShipToPage(1);
    if (shipToDebounceRef.current) clearTimeout(shipToDebounceRef.current);
    shipToDebounceRef.current = setTimeout(() => {
      fetchShipToAddresses(value, 1);
    }, 300);
  }

  function handleShipToPage(newPage: number) {
    setShipToPage(newPage);
    fetchShipToAddresses(shipToQuery, newPage);
  }

  function handleShipToFocus() {
    if (!selectedShipTo && customer) {
      fetchShipToAddresses(shipToQuery);
    }
  }

  function toggleShipToFavorites() {
    const next = !shipToFavoritesOnly;
    setShipToFavoritesOnly(next);
    setShipToPage(1);
    fetchShipToAddresses(shipToQuery, 1, next);
  }

  function selectShipTo(addr: ShipToAddress) {
    setShipToId(addr.shipToId);
    setSelectedShipTo(addr);
    setShipToQuery('');
    setShipToResults([]);
    setShipToOpen(false);
  }

  function clearShipTo() {
    setShipToId('');
    setSelectedShipTo(null);
    setShipToQuery('');
    setShipToResults([]);
    setShipToOpen(false);
    setShipToPage(1);
    setShipToTotalPages(0);
    setShipToFilteredTotal(0);
    setShipToFavoritesOnly(false);
  }

  // --- Totals ---
  const subtotal = lineItems.reduce((sum, item) => sum + lineTotal(item), 0);
  const totalWeight = lineItems.reduce(
    (sum, item) =>
      sum + (item.unitWeight ? item.qtyOrdered * item.unitWeight : 0),
    0,
  );
  const freight = Number(freightAmount) || 0;
  const tax = Number(salesTaxAmount) || 0;
  const total = subtotal + freight + tax;

  // --- Toast for action results ---
  useEffect(() => {
    if (!state.success && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  // --- Submit handler ---
  function handleSubmit(formData: FormData) {
    // Client-side guards. Server re-validates with Zod regardless.
    if (!customer) {
      toast.error('Please select a customer.');
      return;
    }
    if (!shipToId) {
      toast.error('Please select a ship-to address.');
      return;
    }
    if (!salespersonCode) {
      toast.error('Please select a salesperson.');
      return;
    }
    if (!orderDate) {
      toast.error('Please select an order date.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
      toast.error('Order date must be a valid date.');
      return;
    }
    if (freight < 0 || Number.isNaN(freight)) {
      toast.error('Freight amount must be 0 or greater.');
      return;
    }
    if (tax < 0 || Number.isNaN(tax)) {
      toast.error('Sales tax must be 0 or greater.');
      return;
    }

    // Typing in a line's product box clears its product but keeps its price
    // and discount, so the line still counts toward the total. Don't silently
    // drop it.
    const unselectedLineIndex = lineItems.findIndex(
      (li) => li.itemNumber.trim() === '' && lineTotal(li) > 0,
    );
    if (unselectedLineIndex !== -1) {
      toast.error(
        `Line ${unselectedLineIndex + 1} has no product selected. Pick a product or remove the line.`,
      );
      return;
    }

    const cleanedLineItems = lineItems
      .filter((li) => li.itemNumber.trim() !== '')
      .map((li) => ({
        itemNumber: li.itemNumber.trim(),
        qtyOrdered: li.qtyOrdered,
        unitPrice: li.unitPrice,
        discount: li.discount,
      }));

    if (cleanedLineItems.length === 0) {
      toast.error('Please add at least one line item.');
      return;
    }
    if (
      cleanedLineItems.some(
        (li) => !Number.isFinite(li.qtyOrdered) || li.qtyOrdered < 1,
      )
    ) {
      toast.error('Each line item must have a quantity of at least 1.');
      return;
    }
    if (!cleanedLineItems.some((li) => li.qtyOrdered > 0)) {
      toast.error(
        'At least one line item must have a quantity greater than 0.',
      );
      return;
    }
    if (
      cleanedLineItems.some(
        (li) => !Number.isFinite(li.unitPrice) || li.unitPrice < 0,
      )
    ) {
      toast.error('Line item price must be 0 or greater.');
      return;
    }
    if (
      cleanedLineItems.some(
        (li) => !Number.isFinite(li.discount) || li.discount < 0,
      )
    ) {
      toast.error('Line item discount must be 0 or greater.');
      return;
    }

    const orderData = {
      customerNumber: customer.customerNumber,
      salespersonCode,
      orderDate,
      customerPoReference,
      freightTerm,
      shipToId,
      termCode,
      territoryCode,
      freightAmount: freight,
      salesTaxAmount: tax,
      shippingNote,
      lineItems: cleanedLineItems,
    };
    formData.set('orderData', JSON.stringify(orderData));
    formAction(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Customer Selection */}
      <FormSection
        title="Customer"
        description="Search and select the customer for this order.">
        <div className="relative sm:col-span-2" ref={customerContainerRef}>
          <Label htmlFor="customerSearch">Customer</Label>
          <div className="relative mt-2">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="customerSearch"
              placeholder="Search by name, number, or zip..."
              value={customerSearch.query}
              onChange={(e) => customerSearch.setQuery(e.target.value)}
              onFocus={() =>
                customerSearch.results.length > 0 &&
                !customer &&
                customerSearch.setQuery(customerSearch.query)
              }
              className="pr-10 pl-10"
              disabled={!!customer}
            />
            {customer && (
              <button
                type="button"
                onClick={clearCustomer}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2">
                <X className="size-4" />
              </button>
            )}
          </div>
          {customerSearch.isOpen && customerSearch.results.length > 0 && (
            <div className="bg-popover border-border absolute top-full z-50 mt-1 w-full rounded-lg border shadow-lg">
              {customerSearch.results.map((r) => (
                <button
                  key={r.customerNumber}
                  type="button"
                  className="hover:bg-accent flex w-full items-center justify-between px-4 py-3 text-left text-sm first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => selectCustomer(r.customerNumber)}>
                  <div>
                    <div className="font-medium">{r.customerName}</div>
                    {r.primaryContactName && (
                      <div className="text-muted-foreground text-xs">
                        {r.primaryContactName}
                      </div>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {r.customerNumber}
                  </span>
                </button>
              ))}
            </div>
          )}
          {customerSearch.isOpen &&
            customerSearch.query.trim().length >= 2 &&
            customerSearch.results.length === 0 &&
            !customerSearch.isLoading && (
              <div className="bg-popover border-border absolute top-full z-50 mt-1 w-full rounded-lg border p-4 shadow-lg">
                <p className="text-muted-foreground text-center text-sm">
                  No customers found.
                </p>
              </div>
            )}
        </div>

        {customer && shipToTotal > 0 && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="shipToSearch">
              Ship To Address
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                {shipToTotal} location{shipToTotal !== 1 ? 's' : ''}
              </span>
            </Label>

            {selectedShipTo ? (
              <div className="bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {selectedShipTo.isFavorite && (
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    )}
                    {selectedShipTo.locationName}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {selectedShipTo.address1}, {selectedShipTo.city},{' '}
                    {selectedShipTo.stateCode} {selectedShipTo.postalCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearShipTo}
                  className="text-muted-foreground hover:text-foreground ml-2 shrink-0">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="relative" ref={shipToContainerRef}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      id="shipToSearch"
                      placeholder="Search by name, address, city, or zip..."
                      value={shipToQuery}
                      onChange={(e) => handleShipToSearch(e.target.value)}
                      onFocus={handleShipToFocus}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant={shipToFavoritesOnly ? 'default' : 'outline'}
                    size="icon"
                    className="shrink-0"
                    onClick={toggleShipToFavorites}
                    title={
                      shipToFavoritesOnly
                        ? 'Show all addresses'
                        : 'Show favorites only'
                    }>
                    <Star
                      className={`size-4 ${shipToFavoritesOnly ? 'fill-current' : ''}`}
                    />
                  </Button>
                </div>
                {shipToOpen && shipToResults.length > 0 && (
                  <div className="bg-popover border-border absolute top-full z-50 mt-1 w-full rounded-lg border shadow-lg">
                    <div className="max-h-64 overflow-y-auto">
                      {shipToResults.map((addr) => (
                        <button
                          key={addr.shipToId}
                          type="button"
                          className="hover:bg-accent flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm"
                          onClick={() => selectShipTo(addr)}>
                          {addr.isFavorite && (
                            <Star className="mt-0.5 size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-medium">
                              {addr.locationName}
                            </span>
                            <span className="text-muted-foreground block text-xs">
                              {addr.address1}, {addr.city}, {addr.stateCode}{' '}
                              {addr.postalCode}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {/* Pagination footer */}
                    <div className="border-t px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">
                          {shipToFilteredTotal} result
                          {shipToFilteredTotal !== 1 ? 's' : ''}
                          {shipToQuery.trim() &&
                          shipToFilteredTotal !== shipToTotal
                            ? ` (of ${shipToTotal})`
                            : ''}
                        </span>
                        {shipToTotalPages > 1 && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={shipToPage <= 1 || shipToLoading}
                              className="hover:bg-accent rounded p-0.5 disabled:pointer-events-none disabled:opacity-50"
                              onClick={() => handleShipToPage(shipToPage - 1)}>
                              <ChevronLeft className="size-4" />
                            </button>
                            <span className="text-muted-foreground min-w-12 text-center text-xs">
                              {shipToPage} / {shipToTotalPages}
                            </span>
                            <button
                              type="button"
                              disabled={
                                shipToPage >= shipToTotalPages || shipToLoading
                              }
                              className="hover:bg-accent rounded p-0.5 disabled:pointer-events-none disabled:opacity-50"
                              onClick={() => handleShipToPage(shipToPage + 1)}>
                              <ChevronRight className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {shipToOpen &&
                  shipToQuery.trim().length >= 2 &&
                  shipToResults.length === 0 &&
                  !shipToLoading && (
                    <div className="bg-popover border-border absolute top-full z-50 mt-1 w-full rounded-lg border p-4 shadow-lg">
                      <p className="text-muted-foreground text-center text-sm">
                        No addresses found.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </FormSection>

      <Separator />

      {/* Order Details */}
      <FormSection
        title="Order Details"
        description="Date, PO reference, sales rep, and shipping terms.">
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
          <Label htmlFor="customerPoReference">
            Customer PO # <OptionalTag />
          </Label>
          <Input
            id="customerPoReference"
            placeholder="e.g. PO-12345"
            value={customerPoReference}
            onChange={(e) => setCustomerPoReference(e.target.value)}
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salespersonCode">Salesperson</Label>
          <Select
            value={salespersonCode}
            onValueChange={setSalespersonCode}
            required>
            <SelectTrigger id="salespersonCode">
              <SelectValue placeholder="Select salesperson" />
            </SelectTrigger>
            <SelectContent>
              {salespersons.map((sp) => (
                <SelectItem key={sp.employeeId} value={sp.employeeId}>
                  {sp.firstName} {sp.lastName} ({sp.employeeId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="freightTerm">
            Freight Term <OptionalTag />
          </Label>
          <Select value={freightTerm} onValueChange={setFreightTerm}>
            <SelectTrigger id="freightTerm">
              <SelectValue placeholder="Select freight term" />
            </SelectTrigger>
            <SelectContent>
              {freightTerms.map((ft) => (
                <SelectItem key={ft} value={ft}>
                  {ft}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ReferenceCodeSelect
          id="termCode"
          label="Payment Terms"
          placeholder="Select payment terms"
          options={termOptions}
          value={termCode}
          onValueChange={setTermCode}
        />
        <ReferenceCodeSelect
          id="territoryCode"
          label="Territory"
          placeholder="Select a territory"
          options={territoryOptions}
          value={territoryCode}
          onValueChange={setTerritoryCode}
        />
      </FormSection>

      <Separator />

      {/* Line Items */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Line Items</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Add products to this order. Search by item number or description.
          </p>
        </div>

        {/* Horizontal scroll on narrow screens. pb-66 reserves vertical
            room (~264px) for the product-search dropdown (max-h-64 + mt-1)
            so it isn't clipped by the overflow-x container. */}
        <div className="-mx-4 overflow-x-auto px-4 pb-52 sm:mx-0 sm:px-0">
          <div className="min-w-230 space-y-3">
            {/* Header */}
            <div className="border-b pb-2">
              <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,2fr)_64px_56px_88px_88px_80px_72px_88px_36px] gap-3 text-sm font-medium">
                <span>Item Number</span>
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Avail</span>
                <span className="text-right">Inner Price</span>
                <span className="text-right">Case Price</span>
                <span className="text-right">Discount</span>
                <span className="text-right">Weight</span>
                <span className="text-right">Total</span>
                <span />
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <LineItemRow
                  key={item.key}
                  item={item}
                  lastPrice={lastPriceFor(item.itemNumber)}
                  onUpdate={(field, value) =>
                    updateLineItem(item.key, field, value)
                  }
                  onRemove={() => removeLineItem(item.key)}
                  canRemove={lineItems.length > 1}
                  isLast={index === lineItems.length - 1}
                  onAddRow={addLineItem}
                />
              ))}
            </div>

            {/* Subtotal + Total Weight */}
            <div className="space-y-1 border-t pt-3">
              <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,2fr)_64px_56px_88px_88px_80px_72px_88px_36px] gap-3 text-sm font-medium">
                <span className="col-span-8 text-right">Total Weight</span>
                <span className="text-right">
                  {totalWeight.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  lbs
                </span>
                <span />
              </div>
              <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,2fr)_64px_56px_88px_88px_80px_72px_88px_36px] gap-3 text-sm font-medium">
                <span className="col-span-8 text-right">Subtotal</span>
                <span className="text-right">{formatCurrency(subtotal)}</span>
                <span />
              </div>
            </div>
          </div>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
          <Plus className="mr-2 size-4" />
          Add Line Item
        </Button>
      </div>

      <Separator />

      {/* Totals & Notes */}
      <FormSection
        title="Totals & Notes"
        description="Freight, tax, and any shipping instructions.">
        <div className="space-y-2">
          <Label htmlFor="freightAmount">Freight Amount</Label>
          <Input
            id="freightAmount"
            type="number"
            min={0}
            step="0.01"
            value={freightAmount}
            onChange={(e) => setFreightAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salesTaxAmount">Sales Tax</Label>
          <Input
            id="salesTaxAmount"
            type="number"
            min={0}
            step="0.01"
            value={salesTaxAmount}
            onChange={(e) => setSalesTaxAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <span className="text-lg font-semibold">Order Total</span>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shippingNote">
            Shipping Note <OptionalTag />
          </Label>
          <Textarea
            id="shippingNote"
            placeholder="Special shipping instructions..."
            value={shippingNote}
            onChange={(e) => setShippingNote(e.target.value)}
            rows={3}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href={isEdit ? `/orders/${orderNumber}` : '/orders'}>
            Cancel
          </Link>
        </Button>
        <Button type="submit" disabled={pending || !customer}>
          {pending
            ? isEdit
              ? 'Saving...'
              : 'Creating...'
            : isEdit
              ? 'Save Changes'
              : 'Create Order'}
        </Button>
      </div>
    </form>
  );
}

// --- Line Item Row (with product search) ---

function LineItemRow({
  item,
  lastPrice,
  onUpdate,
  onRemove,
  canRemove,
  isLast,
  onAddRow,
}: {
  item: LineItem;
  lastPrice: LastPricePaid | null | undefined;
  onUpdate: (field: keyof LineItem, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
  isLast: boolean;
  onAddRow: () => void;
}) {
  const [productQuery, setProductQuery] = useState(item.itemNumber);
  const [results, setResults] = useState<ProductResult[]>([]);
  // The query `results` were fetched for, so a Tab pressed before the
  // debounced search lands doesn't pick a product from an older query.
  const [resultsQuery, setResultsQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  // Bumped on every search and every pick; a response whose number is no
  // longer current is dropped.
  const requestSeq = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-focus the product search input when a new empty row is mounted
  useEffect(() => {
    if (!item.itemNumber) {
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[role="option"]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  function handleProductSearch(value: string) {
    setProductQuery(value);
    onUpdate('itemNumber', '');
    onUpdate('description', '');
    setHighlightedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    const seq = ++requestSeq.current;
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setResultsQuery('');
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const products = await fetchOrderProducts(q);
      if (seq !== requestSeq.current || !products) return;
      setResults(products);
      setResultsQuery(q);
      setIsOpen(true);
      setHighlightedIndex(bestProductMatchIndex(products, q));
    }, 300);
  }

  // Tab / Enter in the product box: take the highlighted product, or — if the
  // results for what's typed haven't arrived yet — search now and take the
  // best match.
  async function acceptSearch() {
    const q = productQuery.trim();
    if (resultsQuery === q && results.length > 0) {
      selectProduct(results[highlightedIndex >= 0 ? highlightedIndex : 0]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const seq = ++requestSeq.current;
    const products =
      resultsQuery === q ? results : await fetchOrderProducts(q);
    if (seq !== requestSeq.current) return;
    if (!products || products.length === 0) {
      setResults([]);
      setResultsQuery(q);
      setIsOpen(false);
      toast.error(`No product matches "${q}".`);
      return;
    }
    selectProduct(products[bestProductMatchIndex(products, q)]);
  }

  function selectProduct(product: ProductResult) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestSeq.current++;
    setProductQuery(product.itemNumber);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onUpdate('itemNumber', product.itemNumber);
    onUpdate('description', product.description);
    onUpdate('unitPrice', Number(product.casePrice));
    onUpdate('qtyAvailable', product.qtyAvailable);
    onUpdate('innerCasePrice', Number(product.minimumPackPrice));
    const unitWt =
      product.maxQty > 0 ? Number(product.caseWeight) / product.maxQty : 0;
    onUpdate('unitWeight', Math.round(unitWt * 10000) / 10000);
    // Move focus to quantity field after selecting a product
    setTimeout(() => qtyRef.current?.focus(), 0);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Tab / Enter with a typed-but-unpicked product: pick it, so items can
    // be added without touching the dropdown.
    const awaitingPick =
      !item.itemNumber && productQuery.trim().length >= 2;
    if (
      awaitingPick &&
      ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter')
    ) {
      e.preventDefault();
      void acceptSearch();
      return;
    }

    if (!isOpen || results.length === 0) {
      // If Enter is pressed with no dropdown, move to qty
      if (e.key === 'Enter') {
        e.preventDefault();
        qtyRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          selectProduct(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
        break;
      case 'Tab':
        // Close dropdown and let Tab proceed naturally
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }

  function handleDiscountKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // When tabbing forward from the last row's discount, add a new row
    if (e.key === 'Tab' && !e.shiftKey && isLast) {
      e.preventDefault();
      onAddRow();
    }
  }

  return (
    <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,2fr)_64px_56px_88px_88px_80px_72px_88px_36px] items-center gap-3">
      {/* Product search */}
      <div className="relative" ref={containerRef}>
        <Input
          ref={inputRef}
          placeholder="Search product..."
          value={productQuery}
          onChange={(e) => handleProductSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => {
            if (results.length > 0 && !item.itemNumber) {
              setIsOpen(true);
              setHighlightedIndex(0);
            }
          }}
          className="h-8 text-sm"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        {isOpen && results.length > 0 && (
          <div
            ref={resultsRef}
            role="listbox"
            className="bg-popover border-border absolute top-full z-50 mt-1 max-h-64 w-87.5 overflow-y-auto rounded-lg border shadow-lg">
            {results.map((p, index) => (
              <button
                key={p.itemNumber}
                type="button"
                role="option"
                aria-selected={index === highlightedIndex}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs first:rounded-t-lg last:rounded-b-lg ${
                  index === highlightedIndex ? 'bg-accent' : 'hover:bg-accent'
                }`}
                onClick={() => selectProduct(p)}
                onMouseEnter={() => setHighlightedIndex(index)}
                tabIndex={-1}>
                <div>
                  <div className="font-medium">{p.itemNumber}</div>
                  <div className="text-muted-foreground max-w-62.5 truncate">
                    {p.description}
                  </div>
                </div>
                <div className="ml-2 text-right whitespace-nowrap">
                  <div className="text-muted-foreground">
                    ${Number(p.casePrice).toFixed(2)}
                  </div>
                  <div
                    className={
                      p.qtyAvailable > 0
                        ? 'text-muted-foreground'
                        : 'text-destructive'
                    }>
                    {p.qtyAvailable} avail
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <span className="text-muted-foreground truncate text-sm">
        {item.description || '—'}
      </span>

      {/* Quantity */}
      <Input
        ref={qtyRef}
        type="number"
        min={1}
        value={item.qtyOrdered}
        onChange={(e) => onUpdate('qtyOrdered', Number(e.target.value) || 1)}
        onFocus={(e) => e.target.select()}
        className="h-8 text-right text-sm"
      />

      {/* Available Qty */}
      <span
        className={`text-right text-sm ${item.qtyAvailable !== null && item.qtyAvailable < item.qtyOrdered ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
        {item.qtyAvailable !== null ? item.qtyAvailable : '—'}
      </span>

      {/* Inner Case Price (read-only reference) */}
      <span className="text-muted-foreground text-right text-sm">
        {item.innerCasePrice !== null
          ? formatCurrency(item.innerCasePrice)
          : '—'}
      </span>

      {/* Unit Price (read-only, set from product) */}
      <span className="text-right text-sm">
        {item.unitPrice ? formatCurrency(item.unitPrice) : '—'}
      </span>

      {/* Discount */}
      <Input
        ref={discountRef}
        type="number"
        min={0}
        step="0.01"
        value={item.discount === 0 ? '' : item.discount}
        onChange={(e) => onUpdate('discount', Number(e.target.value) || 0)}
        onKeyDown={handleDiscountKeyDown}
        onFocus={(e) => e.target.select()}
        className="h-8 text-right text-sm"
      />

      {/* Line Weight */}
      <span className="text-muted-foreground text-right text-sm">
        {item.unitWeight != null
          ? (item.qtyOrdered * item.unitWeight).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : '—'}
      </span>

      {/* Line Total */}
      <span className="text-right text-sm font-medium">
        {formatCurrency(lineTotal(item))}
      </span>

      {/* Remove */}
      <div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onRemove}
            tabIndex={-1}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      {item.itemNumber && lastPrice !== undefined && (
        <LastPriceNote lastPrice={lastPrice} />
      )}
    </div>
  );
}

// What this customer paid for the item last time, as a pricing reference.
function LastPriceNote({ lastPrice }: { lastPrice: LastPricePaid | null }) {
  return (
    <p className="text-muted-foreground col-span-full -mt-2 text-xs">
      {lastPrice ? (
        <>
          Last paid{' '}
          <span className="text-foreground font-medium">
            {formatCurrency(Number(lastPrice.price))}
          </span>{' '}
          on {formatDate(lastPrice.invoiceDate)} · Invoice #
          {lastPrice.invoiceNumber}
        </>
      ) : (
        'No previous purchase by this customer'
      )}
    </p>
  );
}
