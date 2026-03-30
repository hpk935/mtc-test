'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MapPin, Pencil, Plus, Star } from 'lucide-react';
import type { ShipToAddress } from '../types';
import { ShipToForm } from './ship-to-form';

interface ShipToListProps {
  addresses: ShipToAddress[];
  customerNumber: string;
}

export function ShipToList({ addresses, customerNumber }: ShipToListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShipToAddress | null>(
    null,
  );

  const handleAdd = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  const handleEdit = (address: ShipToAddress) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowForm(false);
      setEditingAddress(null);
    }
  };

  return (
    <>
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-6">
          <MapPin className="text-muted-foreground mb-2 size-6" />
          <p className="text-muted-foreground mb-3 text-sm">
            No shipping addresses yet.
          </p>
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Add Address
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="divide-y rounded-lg border">
            {addresses.map((addr) => (
              <div
                key={addr.shipToId}
                className="hover:bg-muted/50 flex cursor-pointer items-start justify-between gap-3 px-3 py-2.5 transition-colors"
                onClick={() => handleEdit(addr)}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {addr.locationName}
                    </span>
                    {addr.isDefault && (
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
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Add Address
          </Button>
        </div>
      )}

      <ShipToForm
        customerNumber={customerNumber}
        address={editingAddress}
        mode={editingAddress ? 'edit' : 'create'}
        open={showForm}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
