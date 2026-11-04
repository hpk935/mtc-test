'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { todayIso } from '@/lib/dates';
import {
  POSTAL_CODE_HTML_PATTERN,
  POSTAL_CODE_MAX_LENGTH,
  sanitizePostalCodeInput,
} from '@/lib/postal';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { createCustomer, updateCustomer } from '../actions';
import { ACCOUNT_STATUSES } from '../constants';
import { ShipToList } from './ship-to-list';
import type { ShipToAddress } from '../types';
import type { ActionResult } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_hold: 'On Hold',
};

interface Salesperson {
  employeeId: string;
  firstName: string;
  lastName: string;
}

interface CustomerData {
  customerNumber: string;
  customerName: string;
  primaryContactName: string;
  billingAddress1: string;
  billingAddress2: string | null;
  billingCity: string;
  billingStateCode: string;
  billingPostalCode: string;
  countryCode: string;
  mainPhone: string;
  phoneExtension: string | null;
  faxNumber: string | null;
  mainEmail: string;
  taxId: string | null;
  termCode: string;
  territoryCode: string;
  salespersonCode: string;
  defaultFreightTerm: string;
  accountStatus: string;
  accountOpenDate: string;
  customerNote: string | null;
}

interface CustomerFormProps {
  salespersons: Salesperson[];
  termOptions: ReferenceCodeOption[];
  territoryOptions: ReferenceCodeOption[];
  customer?: CustomerData;
  mode?: 'create' | 'edit';
  shipToAddresses?: ShipToAddress[];
  readOnly?: boolean;
}

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
        <h3 className="text-sm font-medium">{title}</h3>
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

const initialState: ActionResult = { success: false, error: '' };

export function CustomerForm({
  salespersons,
  termOptions,
  territoryOptions,
  customer,
  mode = 'create',
  shipToAddresses,
  readOnly,
}: CustomerFormProps) {
  const serverAction = mode === 'edit' ? updateCustomer : createCustomer;
  const isEdit = mode === 'edit';
  const today = todayIso();

  async function actionWithToast(
    _prevState: ActionResult,
    formData: FormData,
  ): Promise<ActionResult> {
    const result = await serverAction(_prevState, formData);
    if (result.success && isEdit) {
      toast.success('Customer updated successfully.');
    } else if (!result.success && result.error) {
      toast.error(result.error);
    }
    return result;
  }

  const [state, formAction, pending] = useActionState(
    actionWithToast,
    initialState,
  );

  const buildInitialValues = () => ({
    customerNumber: customer?.customerNumber ?? '',
    customerName: customer?.customerName ?? '',
    primaryContactName: customer?.primaryContactName ?? '',
    accountOpenDate: customer?.accountOpenDate ?? today,
    mainEmail: customer?.mainEmail ?? '',
    mainPhone: customer?.mainPhone ?? '',
    phoneExtension: customer?.phoneExtension ?? '',
    faxNumber: customer?.faxNumber ?? '',
    billingAddress1: customer?.billingAddress1 ?? '',
    billingAddress2: customer?.billingAddress2 ?? '',
    billingCity: customer?.billingCity ?? '',
    billingStateCode: customer?.billingStateCode ?? '',
    billingPostalCode: customer?.billingPostalCode ?? '',
    countryCode: customer?.countryCode ?? 'US',
    salespersonCode: customer?.salespersonCode ?? '',
    accountStatus: customer?.accountStatus ?? 'active',
    termCode: customer?.termCode ?? '',
    territoryCode: customer?.territoryCode ?? '',
    defaultFreightTerm: customer?.defaultFreightTerm ?? '',
    taxId: customer?.taxId ?? '',
    customerNote: customer?.customerNote ?? '',
    // Shipping address fields (create mode only)
    shipLocationName: '',
    shipAddress1: '',
    shipAddress2: '',
    shipCity: '',
    shipStateCode: '',
    shipPostalCode: '',
    shipCountryCode: 'US',
    shipContactName: '',
    shipPhone: '',
  });

  const [formValues, setFormValues] = useState(buildInitialValues);
  const [savedValues, setSavedValues] = useState(buildInitialValues);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const isDirty =
    isEdit &&
    Object.keys(savedValues).some(
      (key) =>
        formValues[key as keyof typeof formValues] !==
        savedValues[key as keyof typeof savedValues],
    );

  // Imported customers can hold legacy-format contact values. Leave those to
  // the server, which accepts them while unchanged, instead of letting the
  // browser's format checks block the whole save.
  const keepsStoredValue = (name: keyof typeof formValues) =>
    isEdit && formValues[name] === savedValues[name];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    // Phone-like fields: keep digits only.
    const digitsOnlyFields = [
      'mainPhone',
      'phoneExtension',
      'faxNumber',
      'shipPhone',
    ];
    const postalFields = ['billingPostalCode', 'shipPostalCode'];
    const next = digitsOnlyFields.includes(name)
      ? value.replace(/\D/g, '')
      : postalFields.includes(name)
        ? sanitizePostalCodeInput(value)
        : value;
    setFormValues((prev) => ({ ...prev, [name]: next }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form action={formAction} className="space-y-8">
      {/* Hidden customerNumber for edit mode */}
      {isEdit && customer && (
        <input
          type="hidden"
          name="customerNumber"
          value={customer.customerNumber}
        />
      )}

      {/* Customer Information */}
      <FormSection
        title="Customer Information"
        description="Basic customer identity details.">
        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="customerNumber">Customer Number</Label>
            <Input
              id="customerNumber"
              value={formValues.customerNumber}
              readOnly
              disabled
              maxLength={20}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            name="customerName"
            placeholder="Full business name"
            value={formValues.customerName}
            onChange={handleChange}
            required
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryContactName">Primary Contact</Label>
          <Input
            id="primaryContactName"
            name="primaryContactName"
            placeholder="First and last name"
            value={formValues.primaryContactName}
            onChange={handleChange}
            required
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountOpenDate">Account Open Date</Label>
          <DatePicker
            id="accountOpenDate"
            value={formValues.accountOpenDate}
            onChange={(value) =>
              setFormValues((prev) => ({ ...prev, accountOpenDate: value }))
            }
            aria-label="Account Open Date"
          />
          <input
            type="hidden"
            name="accountOpenDate"
            value={formValues.accountOpenDate}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Contact Details */}
      <FormSection title="Contact Details" description="Phone, email, and fax.">
        <div className="space-y-2">
          <Label htmlFor="mainEmail">Email Address</Label>
          <Input
            id="mainEmail"
            name="mainEmail"
            type={keepsStoredValue('mainEmail') ? 'text' : 'email'}
            placeholder="orders@example.com"
            value={formValues.mainEmail}
            onChange={handleChange}
            required
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mainPhone">Phone Number</Label>
          <Input
            id="mainPhone"
            name="mainPhone"
            type="tel"
            inputMode="numeric"
            pattern={keepsStoredValue('mainPhone') ? undefined : '\\d*'}
            placeholder="5551234567"
            value={formValues.mainPhone}
            onChange={handleChange}
            required
            maxLength={20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneExtension">
            Extension <OptionalTag />
          </Label>
          <Input
            id="phoneExtension"
            name="phoneExtension"
            inputMode="numeric"
            pattern="\d*"
            placeholder="e.g. 204"
            value={formValues.phoneExtension}
            onChange={handleChange}
            maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="faxNumber">
            Fax Number <OptionalTag />
          </Label>
          <Input
            id="faxNumber"
            name="faxNumber"
            inputMode="numeric"
            pattern={keepsStoredValue('faxNumber') ? undefined : '\\d*'}
            placeholder="5551234568"
            value={formValues.faxNumber}
            onChange={handleChange}
            maxLength={20}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Billing Address */}
      <FormSection
        title="Billing Address"
        description="Invoice and billing address.">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="billingAddress1">Street Address</Label>
          <Input
            id="billingAddress1"
            name="billingAddress1"
            placeholder="Street address, P.O. Box"
            value={formValues.billingAddress1}
            onChange={handleChange}
            required
            maxLength={255}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="billingAddress2">
            Address Line 2 <OptionalTag />
          </Label>
          <Input
            id="billingAddress2"
            name="billingAddress2"
            placeholder="Suite, unit, building, floor, etc."
            value={formValues.billingAddress2}
            onChange={handleChange}
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingCity">City</Label>
          <Input
            id="billingCity"
            name="billingCity"
            value={formValues.billingCity}
            onChange={handleChange}
            required
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingStateCode">State</Label>
          <Input
            id="billingStateCode"
            name="billingStateCode"
            placeholder="e.g. TX"
            value={formValues.billingStateCode}
            onChange={handleChange}
            required
            maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingPostalCode">ZIP / Postal Code</Label>
          <Input
            id="billingPostalCode"
            name="billingPostalCode"
            pattern={
              keepsStoredValue('billingPostalCode')
                ? undefined
                : POSTAL_CODE_HTML_PATTERN
            }
            placeholder="e.g. 75165 or 75165-1234"
            value={formValues.billingPostalCode}
            onChange={handleChange}
            required
            maxLength={POSTAL_CODE_MAX_LENGTH}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="countryCode">Country Code</Label>
          <Input
            id="countryCode"
            name="countryCode"
            value={formValues.countryCode}
            onChange={handleChange}
            maxLength={5}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Shipping Address — create mode only */}
      {!isEdit && (
        <>
          <FormSection
            title="Shipping Address"
            description="Default ship-to location.">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="shipLocationName">Location Name</Label>
              <Input
                id="shipLocationName"
                name="shipLocationName"
                placeholder="e.g. Main Store, Warehouse"
                value={formValues.shipLocationName}
                onChange={handleChange}
                required
                maxLength={255}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id="sameAsBilling"
                name="sameAsBilling"
                checked={sameAsBilling}
                onCheckedChange={(checked) =>
                  setSameAsBilling(checked === true)
                }
              />
              <Label htmlFor="sameAsBilling" className="text-sm font-normal">
                Same as billing address
              </Label>
            </div>
            {/* Hidden field to pass sameAsBilling to server action */}
            {sameAsBilling && (
              <input type="hidden" name="sameAsBilling" value="true" />
            )}
            {!sameAsBilling && (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shipAddress1">Street Address</Label>
                  <Input
                    id="shipAddress1"
                    name="shipAddress1"
                    placeholder="Street address"
                    value={formValues.shipAddress1}
                    onChange={handleChange}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shipAddress2">
                    Address Line 2 <OptionalTag />
                  </Label>
                  <Input
                    id="shipAddress2"
                    name="shipAddress2"
                    placeholder="Suite, unit, dock, etc."
                    value={formValues.shipAddress2}
                    onChange={handleChange}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipCity">City</Label>
                  <Input
                    id="shipCity"
                    name="shipCity"
                    value={formValues.shipCity}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipStateCode">State</Label>
                  <Input
                    id="shipStateCode"
                    name="shipStateCode"
                    placeholder="e.g. TX"
                    value={formValues.shipStateCode}
                    onChange={handleChange}
                    required
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipPostalCode">ZIP / Postal Code</Label>
                  <Input
                    id="shipPostalCode"
                    name="shipPostalCode"
                    pattern={POSTAL_CODE_HTML_PATTERN}
                    placeholder="e.g. 75165 or 75165-1234"
                    value={formValues.shipPostalCode}
                    onChange={handleChange}
                    required
                    maxLength={POSTAL_CODE_MAX_LENGTH}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipCountryCode">Country Code</Label>
                  <Input
                    id="shipCountryCode"
                    name="shipCountryCode"
                    value={formValues.shipCountryCode}
                    onChange={handleChange}
                    maxLength={5}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="shipContactName">
                Site Contact <OptionalTag />
              </Label>
              <Input
                id="shipContactName"
                name="shipContactName"
                placeholder="Name at this location"
                value={formValues.shipContactName}
                onChange={handleChange}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipPhone">
                Site Phone <OptionalTag />
              </Label>
              <Input
                id="shipPhone"
                name="shipPhone"
                type="tel"
                inputMode="numeric"
                pattern="\d*"
                placeholder="5551234567"
                value={formValues.shipPhone}
                onChange={handleChange}
                maxLength={20}
              />
            </div>
          </FormSection>

          <Separator />
        </>
      )}

      {/* Shipping Addresses — edit mode only */}
      {isEdit && shipToAddresses && (
        <>
          <FormSection
            title="Shipping Addresses"
            description="Ship-to locations on file.">
            <div className="sm:col-span-2">
              <ShipToList
                addresses={shipToAddresses}
                customerNumber={customer!.customerNumber}
              />
            </div>
          </FormSection>

          <Separator />
        </>
      )}

      {/* Account & Sales */}
      <FormSection
        title="Account & Sales"
        description="Terms, territory, and sales rep.">
        <div className="space-y-2">
          <Label htmlFor="salespersonCode">Salesperson</Label>
          {/* Hidden input drives FormData. Radix Select's built-in `name`
              prop falls back to the first <option> when value is '',
              which silently bypasses required validation. */}
          <input
            type="hidden"
            name="salespersonCode"
            value={formValues.salespersonCode}
          />
          <Select
            value={formValues.salespersonCode}
            onValueChange={(v) => handleSelectChange('salespersonCode', v)}>
            <SelectTrigger id="salespersonCode">
              <SelectValue placeholder="Select a salesperson" />
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
          <Label htmlFor="accountStatus">Account Status</Label>
          <Select
            name="accountStatus"
            value={formValues.accountStatus}
            onValueChange={(v) => handleSelectChange('accountStatus', v)}>
            <SelectTrigger id="accountStatus">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ReferenceCodeSelect
          id="termCode"
          name="termCode"
          label="Payment Terms"
          placeholder="Select payment terms"
          options={termOptions}
          value={formValues.termCode}
          onValueChange={(v) => handleSelectChange('termCode', v)}
        />
        <ReferenceCodeSelect
          id="territoryCode"
          name="territoryCode"
          label="Territory"
          placeholder="Select a territory"
          options={territoryOptions}
          value={formValues.territoryCode}
          onValueChange={(v) => handleSelectChange('territoryCode', v)}
        />
        <div className="space-y-2">
          <Label htmlFor="defaultFreightTerm">
            Freight Term <OptionalTag />
          </Label>
          <Input
            id="defaultFreightTerm"
            name="defaultFreightTerm"
            placeholder="e.g. 10% Freight"
            value={formValues.defaultFreightTerm}
            onChange={handleChange}
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxId">
            Tax ID <OptionalTag />
          </Label>
          <Input
            id="taxId"
            name="taxId"
            placeholder="e.g. 38-3079207"
            value={formValues.taxId}
            onChange={handleChange}
            maxLength={20}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Notes */}
      <FormSection title="Notes" description="Additional notes.">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="customerNote">
            Customer Note <OptionalTag />
          </Label>
          <Textarea
            id="customerNote"
            name="customerNote"
            placeholder="e.g. Prefers emailed invoices, special delivery instructions..."
            value={formValues.customerNote}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Actions */}
      {!readOnly && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/customers">Cancel</Link>
          </Button>
          <Button type="submit" disabled={pending || (isEdit && !isDirty)}>
            {pending
              ? isEdit
                ? 'Saving...'
                : 'Creating...'
              : isEdit
                ? 'Save Changes'
                : 'Create Customer'}
          </Button>
        </div>
      )}
    </form>
  );
}
