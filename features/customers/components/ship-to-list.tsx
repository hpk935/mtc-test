'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MapPin, Plus, Star } from 'lucide-react';
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

  const handleClose = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Shipping Addresses</h2>
          <p className="text-muted-foreground text-sm">
            Manage where orders can be shipped for this customer.
          </p>
        </div>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-2 size-4" />
          Add Address
        </Button>
      </div>

      {showForm && (
        <ShipToForm
          customerNumber={customerNumber}
          address={editingAddress}
          mode={editingAddress ? 'edit' : 'create'}
          onClose={handleClose}
        />
      )}

      {addresses.length === 0 && !showForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MapPin className="text-muted-foreground mb-2 size-8" />
            <p className="text-muted-foreground text-sm">
              No shipping addresses yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <Card
              key={addr.shipToId}
              className="hover:border-foreground/20 cursor-pointer transition-colors"
              onClick={() => handleEdit(addr)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">
                      {addr.locationName}
                    </CardTitle>
                    {addr.isDefault && (
                      <Star className="size-3.5 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      addr.locationStatus === 'active'
                        ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400'
                        : 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-400'
                    }>
                    {addr.locationStatus === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {addr.shipToId}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{addr.address1}</p>
                {addr.address2 && <p>{addr.address2}</p>}
                <p>
                  {addr.city}, {addr.stateCode} {addr.postalCode}
                </p>
                {addr.contactName && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {addr.contactName}
                    {addr.mainPhone ? ` · ${addr.mainPhone}` : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
