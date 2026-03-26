'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createShipTo, updateShipTo, deleteShipTo } from '../actions';
import { LOCATION_STATUSES } from '../constants';
import type { ShipToAddress } from '../types';
import type { ActionResult } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

interface ShipToFormProps {
  customerNumber: string;
  address?: ShipToAddress | null;
  mode: 'create' | 'edit';
  onClose: () => void;
}

const initialState: ActionResult = { success: false, error: '' };

export function ShipToForm({
  customerNumber,
  address,
  mode,
  onClose,
}: ShipToFormProps) {
  const action = mode === 'edit' ? updateShipTo : createShipTo;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = mode === 'edit';

  const [formValues, setFormValues] = useState({
    shipToId: address?.shipToId ?? '',
    locationName: address?.locationName ?? '',
    locationStatus: address?.locationStatus ?? 'active',
    address1: address?.address1 ?? '',
    address2: address?.address2 ?? '',
    city: address?.city ?? '',
    stateCode: address?.stateCode ?? '',
    postalCode: address?.postalCode ?? '',
    countryCode: address?.countryCode ?? 'US',
    contactName: address?.contactName ?? '',
    mainPhone: address?.mainPhone ?? '',
    isDefault: address?.isDefault ?? false,
    customerNote: address?.customerNote ?? '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  if (state.success) {
    onClose();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEdit ? `Edit ${address?.locationName}` : 'New Shipping Address'}
        </CardTitle>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="customerNumber" value={customerNumber} />
        {isEdit && address && (
          <input type="hidden" name="shipToId" value={address.shipToId} />
        )}

        <CardContent className="space-y-4">
          {!state.success && state.error && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-4 py-3 text-sm">
              {state.error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="shipToId">Ship-To ID</Label>
                <Input
                  id="shipToId"
                  name="shipToId"
                  placeholder="e.g. ST-0013"
                  value={formValues.shipToId}
                  onChange={handleChange}
                  required
                  maxLength={20}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                name="locationName"
                placeholder="e.g. Main Warehouse"
                value={formValues.locationName}
                onChange={handleChange}
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationStatus">Status</Label>
              <Select
                name="locationStatus"
                value={formValues.locationStatus}
                onValueChange={(v) => handleSelectChange('locationStatus', v)}>
                <SelectTrigger id="locationStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address1">Address Line 1</Label>
              <Input
                id="address1"
                name="address1"
                placeholder="Street address"
                value={formValues.address1}
                onChange={handleChange}
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address2">
                Address Line 2{' '}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="address2"
                name="address2"
                placeholder="Suite, unit, dock, etc."
                value={formValues.address2}
                onChange={handleChange}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formValues.city}
                onChange={handleChange}
                required
                maxLength={100}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stateCode">State</Label>
                <Input
                  id="stateCode"
                  name="stateCode"
                  placeholder="CA"
                  value={formValues.stateCode}
                  onChange={handleChange}
                  required
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Zip Code</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="90001"
                  value={formValues.postalCode}
                  onChange={handleChange}
                  required
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">
                Contact Name{' '}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="contactName"
                name="contactName"
                placeholder="Site contact"
                value={formValues.contactName}
                onChange={handleChange}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipMainPhone">
                Phone{' '}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="shipMainPhone"
                name="mainPhone"
                placeholder="(555) 123-4567"
                value={formValues.mainPhone}
                onChange={handleChange}
                maxLength={20}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isDefault"
              name="isDefault"
              checked={formValues.isDefault}
              onCheckedChange={(checked) =>
                setFormValues((prev) => ({
                  ...prev,
                  isDefault: checked === true,
                }))
              }
            />
            <Label htmlFor="isDefault" className="text-sm font-normal">
              Set as default shipping address
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipCustomerNote">
              Note{' '}
              <span className="text-muted-foreground text-xs font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="shipCustomerNote"
              name="customerNote"
              placeholder="Delivery instructions, dock info, etc."
              value={formValues.customerNote}
              onChange={handleChange}
              rows={2}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <div>
            {isEdit && address && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={async () => {
                  const fd = new FormData();
                  fd.set('shipToId', address.shipToId);
                  fd.set('customerNumber', customerNumber);
                  await deleteShipTo(fd);
                  onClose();
                }}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending
                ? 'Saving...'
                : isEdit
                  ? 'Update Address'
                  : 'Add Address'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
