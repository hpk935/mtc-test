'use client';

import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
} from 'lucide-react';
import type { ShipToAddress } from '../types';
import { ShipToForm } from './ship-to-form';
import { Input } from '@/components/ui/input';

const PAGE_SIZE = 10;

interface ShipToListProps {
  addresses: ShipToAddress[];
  customerNumber: string;
}

export function ShipToList({ addresses, customerNumber }: ShipToListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShipToAddress | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const hasFavorites = useMemo(
    () => addresses.some((addr) => addr.isFavorite),
    [addresses],
  );

  const filteredAddresses = useMemo(() => {
    let result = addresses;
    if (showFavoritesOnly) {
      result = result.filter((addr) => addr.isFavorite);
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (addr) =>
          addr.locationName.toLowerCase().includes(term) ||
          addr.address1.toLowerCase().includes(term) ||
          (addr.address2?.toLowerCase().includes(term) ?? false) ||
          addr.city.toLowerCase().includes(term) ||
          addr.stateCode.toLowerCase().includes(term) ||
          addr.postalCode.toLowerCase().includes(term) ||
          (addr.contactName?.toLowerCase().includes(term) ?? false),
      );
    }
    return result;
  }, [addresses, search, showFavoritesOnly]);

  const totalPages = Math.ceil(filteredAddresses.length / PAGE_SIZE);
  const paginatedAddresses = useMemo(
    () => filteredAddresses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredAddresses, page],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  const handleEdit = (address: ShipToAddress) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setShowForm(false);
      setEditingAddress(null);
    }
  }, []);

  return (
    <>
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-6">
          <MapPin className="text-muted-foreground mb-2 size-6" />
          <p className="text-muted-foreground mb-3 text-sm">
            No shipping addresses yet.
          </p>
          <Button size="sm" variant="outline" type="button" onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Add Address
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.length > PAGE_SIZE && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  type="search"
                  placeholder="Search addresses..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
              {hasFavorites && (
                <Button
                  size="sm"
                  type="button"
                  variant={showFavoritesOnly ? 'default' : 'outline'}
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => {
                    setShowFavoritesOnly((v) => !v);
                    setPage(1);
                  }}>
                  <Star
                    className={cn(
                      'size-3',
                      showFavoritesOnly && 'fill-current',
                    )}
                  />
                  Favorites
                </Button>
              )}
            </div>
          )}
          <div className="divide-y rounded-lg border">
            {paginatedAddresses.map((addr) => (
              <div
                key={addr.shipToId}
                className="hover:bg-muted/50 flex cursor-pointer items-start justify-between gap-3 px-3 py-2.5 transition-colors"
                onClick={() => handleEdit(addr)}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {addr.locationName}
                    </span>
                    {addr.isFavorite && (
                      <Star className="size-3 shrink-0 fill-yellow-500 text-yellow-500" />
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 px-1.5 py-0 text-[10px]',
                        addr.locationStatus === 'active'
                          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400'
                          : 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-400',
                      )}>
                      {addr.locationStatus === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {addr.address1}
                    {addr.address2 ? `, ${addr.address2}` : ''} &middot;{' '}
                    {addr.city}, {addr.stateCode} {addr.postalCode}
                  </p>
                  {addr.contactName && (
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {addr.contactName}
                      {addr.mainPhone ? ` · ${addr.mainPhone}` : ''}
                    </p>
                  )}
                </div>
                <Pencil className="text-muted-foreground mt-1 size-3.5 shrink-0" />
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {search.trim()
                  ? `${filteredAddresses.length} of ${addresses.length} addresses`
                  : `${addresses.length} addresses`}{' '}
                &middot; Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="size-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="size-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
          <Button size="sm" variant="outline" type="button" onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Add Address
          </Button>
        </div>
      )}

      <ShipToForm
        key={editingAddress ? `edit-${editingAddress.shipToId}` : 'create'}
        customerNumber={customerNumber}
        address={editingAddress}
        mode={editingAddress ? 'edit' : 'create'}
        open={showForm}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
