'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  isValidPostalCode,
  POSTAL_CODE_HTML_PATTERN,
  POSTAL_CODE_MAX_LENGTH,
  POSTAL_CODE_MESSAGE,
  sanitizePostalCodeInput,
} from '@/lib/postal';
import { createVendor, updateVendor } from '../actions';
import type { LegacyVendorField } from '../validation';
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

function OptionalTag() {
  return (
    <span className="text-muted-foreground ml-1 text-xs font-normal">
      (optional)
    </span>
  );
}

const DIGIT_ONLY_FIELDS = new Set(['phone', 'fax']);

type Props = {
  vendor?: Vendor;
  mode?: 'create' | 'edit';
  readOnly?: boolean;
};

export function VendorForm({ vendor, mode = 'create', readOnly }: Props) {
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
    vendorType: vendor?.vendorType ?? '',
    paymentTerms: vendor?.paymentTerms ?? '',
    glAccountCode: vendor?.glAccountCode ?? '',
    dateAdded: vendor?.dateAdded ?? '',
    isActive: vendor?.isActive ?? true,
  };

  const [values, setValues] = useState(initial);

  // Edit mode: disable submit until something actually changed.
  const isDirty = (Object.keys(initial) as Array<keyof typeof initial>).some(
    (k) => values[k] !== initial[k],
  );

  // Imported vendors can have blank or legacy-format contact and address
  // values. Leave those unchanged ones to the server, which accepts them as-is,
  // instead of blocking the save here; a changed value must pass the checks.
  const keepsStoredValue = (name: LegacyVendorField) =>
    isEdit && values[name] === initial[name];
  const mustCheck = (name: LegacyVendorField) => !keepsStoredValue(name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const next = DIGIT_ONLY_FIELDS.has(name)
      ? value.replace(/\D/g, '')
      : name === 'zip'
        ? sanitizePostalCodeInput(value)
        : value;
    setValues((prev) => ({ ...prev, [name]: next }));
  };

  async function action(
    _: ActionResult<unknown> | null,
    formData: FormData,
  ): Promise<ActionResult<unknown>> {
    // Client-side guards (mirrors Zod schema; surfaces toast for first error).
    if (!values.vendorCode.trim()) {
      toast.error('Vendor code is required.');
      return { success: false, error: 'Vendor code is required.' };
    }
    if (!values.name.trim()) {
      toast.error('Name is required.');
      return { success: false, error: 'Name is required.' };
    }
    if (!values.vendorType) {
      toast.error('Vendor type is required.');
      return { success: false, error: 'Vendor type is required.' };
    }
    if (mustCheck('contactName') && !values.contactName.trim()) {
      toast.error('Contact name is required.');
      return { success: false, error: 'Contact name is required.' };
    }
    if (mustCheck('phone') && !/^\d{7,20}$/.test(values.phone)) {
      toast.error('Phone must contain 7–20 digits.');
      return { success: false, error: 'Phone is required.' };
    }
    if (mustCheck('address1') && !values.address1.trim()) {
      toast.error('Address 1 is required.');
      return { success: false, error: 'Address 1 is required.' };
    }
    if (mustCheck('city') && !values.city.trim()) {
      toast.error('City is required.');
      return { success: false, error: 'City is required.' };
    }
    if (mustCheck('state') && !values.state.trim()) {
      toast.error('State is required.');
      return { success: false, error: 'State is required.' };
    }
    if (mustCheck('zip') && !isValidPostalCode(values.zip)) {
      toast.error(POSTAL_CODE_MESSAGE);
      return { success: false, error: POSTAL_CODE_MESSAGE };
    }

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

  const [, formAction, pending] = useActionState<
    ActionResult<unknown> | null,
    FormData
  >(action, null);

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
            placeholder="e.g. ACME01"
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
            placeholder="Vendor name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendorType">Type</Label>
          {/* Hidden input drives FormData. Avoids the Radix Select's hidden
              native <select> falling back to the first option when value=''. */}
          <input type="hidden" name="vendorType" value={values.vendorType} />
          <Select
            value={values.vendorType}
            onValueChange={(v) => setValues((p) => ({ ...p, vendorType: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
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
            required={mustCheck('contactName')}
            maxLength={100}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            required={mustCheck('phone')}
            inputMode="numeric"
            pattern={mustCheck('phone') ? '\\d*' : undefined}
            maxLength={20}
            placeholder="5551234567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fax">
            Fax <OptionalTag />
          </Label>
          <Input
            id="fax"
            name="fax"
            value={values.fax}
            onChange={handleChange}
            inputMode="numeric"
            pattern={mustCheck('fax') ? '\\d*' : undefined}
            maxLength={20}
            placeholder="5551234567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNumber">
            Acct ID <OptionalTag />
          </Label>
          <Input
            id="accountNumber"
            name="accountNumber"
            value={values.accountNumber}
            onChange={handleChange}
            maxLength={50}
            placeholder="Vendor-assigned account #"
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
            required={mustCheck('address1')}
            maxLength={255}
            placeholder="Street address"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address2">
            Address 2 <OptionalTag />
          </Label>
          <Input
            id="address2"
            name="address2"
            value={values.address2}
            onChange={handleChange}
            maxLength={255}
            placeholder="Suite, unit, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={values.city}
            onChange={handleChange}
            required={mustCheck('city')}
            maxLength={100}
            placeholder="City"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            value={values.state}
            onChange={handleChange}
            required={mustCheck('state')}
            maxLength={10}
            placeholder="e.g. CA"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP / Postal Code</Label>
          <Input
            id="zip"
            name="zip"
            value={values.zip}
            onChange={handleChange}
            required={mustCheck('zip')}
            pattern={mustCheck('zip') ? POSTAL_CODE_HTML_PATTERN : undefined}
            maxLength={POSTAL_CODE_MAX_LENGTH}
            placeholder="12345 or 12345-6789"
          />
        </div>
      </FormSection>

      <Separator />

      <FormSection
        title="Accounting"
        description="Tax ID, 1099 status, terms, and account no.">
        <div className="space-y-2">
          <Label htmlFor="taxId">
            Tax ID <OptionalTag />
          </Label>
          <Input
            id="taxId"
            name="taxId"
            value={values.taxId}
            onChange={handleChange}
            maxLength={20}
            placeholder="EIN or SSN"
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
          <Label htmlFor="paymentTerms">
            Payment Terms <OptionalTag />
          </Label>
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
          <Label htmlFor="glAccountCode">
            Account No <OptionalTag />
          </Label>
          <Input
            id="glAccountCode"
            name="glAccountCode"
            value={values.glAccountCode}
            onChange={handleChange}
            maxLength={10}
            placeholder="GL account code"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateAdded">
            Date Added <OptionalTag />
          </Label>
          <DatePicker
            id="dateAdded"
            value={values.dateAdded}
            onChange={(value) =>
              setValues((prev) => ({ ...prev, dateAdded: value }))
            }
            aria-label="Date Added"
          />
          {/* FormData carries the date for the server action. */}
          <input type="hidden" name="dateAdded" value={values.dateAdded} />
        </div>
      </FormSection>

      {!readOnly && (
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link
              href={isEdit && vendor ? `/vendors/${vendor.id}` : '/vendors'}>
              Cancel
            </Link>
          </Button>
          <Button type="submit" disabled={pending || (isEdit && !isDirty)}>
            {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Vendor'}
          </Button>
        </div>
      )}
    </form>
  );
}
