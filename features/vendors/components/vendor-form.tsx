'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { createVendor, updateVendor } from '../actions';
import { VENDOR_TYPES, VENDOR_TYPE_LABEL } from '../constants';
import type { Vendor } from '../types';
import type { ActionResult } from '@/types';

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
    <div className="grid gap-6 md:grid-cols-[160px_1fr] lg:grid-cols-[200px_1fr]">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

type Props = {
  vendor?: Vendor;
  mode?: 'create' | 'edit';
};

export function VendorForm({ vendor, mode = 'create' }: Props) {
  const isEdit = mode === 'edit';

  const initial = {
    vendorCode: vendor?.vendorCode ?? '',
    name: vendor?.name ?? '',
    address1: vendor?.address1 ?? '',
    address2: vendor?.address2 ?? '',
    city: vendor?.city ?? '',
    state: vendor?.state ?? '',
    zip: vendor?.zip ?? '',
    phone: vendor?.phone ?? '',
    fax: vendor?.fax ?? '',
    accountNumber: vendor?.accountNumber ?? '',
    contactName: vendor?.contactName ?? '',
    taxId: vendor?.taxId ?? '',
    send1099: vendor?.send1099 ?? false,
    vendorType: vendor?.vendorType ?? 'CS',
    paymentTerms: vendor?.paymentTerms ?? '',
    glAccountCode: vendor?.glAccountCode ?? '',
    dateAdded: vendor?.dateAdded ?? '',
    isActive: vendor?.isActive ?? true,
  };

  const [values, setValues] = useState(initial);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  async function action(_: ActionResult | null, formData: FormData) {
    // Sync checkboxes (radix) into formData
    formData.set('send1099', values.send1099 ? 'on' : 'off');
    formData.set('isActive', values.isActive ? 'on' : 'off');
    formData.set('vendorType', values.vendorType);

    const result =
      isEdit && vendor
        ? await updateVendor(vendor.id, formData)
        : await createVendor(formData);

    if (result.success) {
      toast.success(isEdit ? 'Vendor updated.' : 'Vendor created.');
      if (!isEdit && 'data' in result) {
        window.location.href = `/vendors/${(result.data as { id: number }).id}`;
      }
    } else {
      toast.error(result.error);
    }
    return result;
  }

  const [, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="space-y-8">
      <FormSection
        title="Identification"
        description="Code, name, type, and activity.">
        <div className="space-y-2">
          <Label htmlFor="vendorCode">Vendor Code</Label>
          <Input
            id="vendorCode"
            name="vendorCode"
            value={values.vendorCode}
            onChange={handleChange}
            required
            maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={values.name}
            onChange={handleChange}
            required
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendorType">Type</Label>
          <Select
            value={values.vendorType}
            onValueChange={(v) =>
              setValues((p) => ({ ...p, vendorType: v as 'CS' | 'CO' }))
            }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VENDOR_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {VENDOR_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="isActive"
            checked={values.isActive}
            onCheckedChange={(checked) =>
              setValues((p) => ({ ...p, isActive: checked === true }))
            }
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </FormSection>

      <Separator />

      <FormSection title="Contact" description="Primary contact and phones.">
        <div className="space-y-2">
          <Label htmlFor="contactName">Contact Name</Label>
          <Input
            id="contactName"
            name="contactName"
            value={values.contactName}
            onChange={handleChange}
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            maxLength={20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fax">Fax</Label>
          <Input
            id="fax"
            name="fax"
            value={values.fax}
            onChange={handleChange}
            maxLength={20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Acct ID</Label>
          <Input
            id="accountNumber"
            name="accountNumber"
            value={values.accountNumber}
            onChange={handleChange}
            maxLength={50}
          />
        </div>
      </FormSection>

      <Separator />

      <FormSection title="Address" description="Mailing address.">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address1">Address 1</Label>
          <Input
            id="address1"
            name="address1"
            value={values.address1}
            onChange={handleChange}
            maxLength={255}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address2">Address 2</Label>
          <Input
            id="address2"
            name="address2"
            value={values.address2}
            onChange={handleChange}
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={values.city}
            onChange={handleChange}
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            value={values.state}
            onChange={handleChange}
            maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">Zip</Label>
          <Input
            id="zip"
            name="zip"
            value={values.zip}
            onChange={handleChange}
            maxLength={20}
          />
        </div>
      </FormSection>

      <Separator />

      <FormSection
        title="Accounting"
        description="Tax ID, 1099 status, terms, and account no.">
        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID</Label>
          <Input
            id="taxId"
            name="taxId"
            value={values.taxId}
            onChange={handleChange}
            maxLength={20}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="send1099"
            checked={values.send1099}
            onCheckedChange={(checked) =>
              setValues((p) => ({ ...p, send1099: checked === true }))
            }
          />
          <Label htmlFor="send1099">Send 1099</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentTerms">Payment Terms</Label>
          <Input
            id="paymentTerms"
            name="paymentTerms"
            placeholder="e.g. 30, 15, CA, RG, PP"
            value={values.paymentTerms}
            onChange={handleChange}
            maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="glAccountCode">Account No</Label>
          <Input
            id="glAccountCode"
            name="glAccountCode"
            value={values.glAccountCode}
            onChange={handleChange}
            maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateAdded">Date Added</Label>
          <Input
            id="dateAdded"
            name="dateAdded"
            type="date"
            value={values.dateAdded}
            onChange={handleChange}
          />
        </div>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" asChild>
          <Link href={isEdit && vendor ? `/vendors/${vendor.id}` : '/vendors'}>
            Cancel
          </Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Vendor'}
        </Button>
      </div>
    </form>
  );
}
