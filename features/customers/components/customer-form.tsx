'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { createCustomer } from '../actions';
import { ACCOUNT_STATUSES } from '../constants';
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

interface CustomerFormProps {
  salespersons: Salesperson[];
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

const initialState: ActionResult = { success: false, error: '' };

export function CustomerForm({ salespersons }: CustomerFormProps) {
  const [state, formAction, pending] = useActionState(
    createCustomer,
    initialState,
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <form action={formAction} className="space-y-8">
      {!state.success && state.error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      {/* Customer Information */}
      <FormSection
        title="Customer Information"
        description="Basic details used to identify this customer account.">
        <div className="space-y-2">
          <Label htmlFor="customerNumber">Customer Number</Label>
          <Input
            id="customerNumber"
            name="customerNumber"
            placeholder="e.g. 22-174"
            required
            maxLength={20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            name="customerName"
            placeholder="Full business name"
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
            required
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountOpenDate">Account Open Date</Label>
          <Input
            id="accountOpenDate"
            name="accountOpenDate"
            type="date"
            defaultValue={today}
            required
          />
        </div>
      </FormSection>

      <Separator />

      {/* Contact Details */}
      <FormSection
        title="Contact Details"
        description="How to reach this customer by phone or email.">
        <div className="space-y-2">
          <Label htmlFor="mainEmail">Email Address</Label>
          <Input
            id="mainEmail"
            name="mainEmail"
            type="email"
            placeholder="orders@example.com"
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
            placeholder="(555) 123-4567"
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
            placeholder="e.g. 204"
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
            placeholder="(555) 123-4568"
            maxLength={20}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Billing Address */}
      <FormSection
        title="Billing Address"
        description="The address used for invoices and billing correspondence.">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="billingAddress1">Street Address</Label>
          <Input
            id="billingAddress1"
            name="billingAddress1"
            placeholder="Street address, P.O. Box"
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
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingCity">City</Label>
          <Input id="billingCity" name="billingCity" required maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingStateCode">State</Label>
          <Input
            id="billingStateCode"
            name="billingStateCode"
            placeholder="e.g. TX"
            required
            maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billingPostalCode">ZIP / Postal Code</Label>
          <Input
            id="billingPostalCode"
            name="billingPostalCode"
            placeholder="e.g. 75165"
            required
            maxLength={20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="countryCode">Country Code</Label>
          <Input
            id="countryCode"
            name="countryCode"
            defaultValue="US"
            maxLength={5}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Account & Sales */}
      <FormSection
        title="Account & Sales"
        description="Payment terms, territory assignment, and sales rep for this customer.">
        <div className="space-y-2">
          <Label htmlFor="salespersonCode">Salesperson</Label>
          <Select name="salespersonCode" required>
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
          <Select name="accountStatus" defaultValue="active">
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
        <div className="space-y-2">
          <Label htmlFor="termCode">Payment Terms</Label>
          <Input
            id="termCode"
            name="termCode"
            placeholder="e.g. 30, 60, CH"
            required
            maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="territoryCode">Territory</Label>
          <Input
            id="territoryCode"
            name="territoryCode"
            placeholder="e.g. TX-10"
            required
            maxLength={20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultFreightTerm">Freight Term</Label>
          <Input
            id="defaultFreightTerm"
            name="defaultFreightTerm"
            placeholder="e.g. 10% Freight"
            required
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
            maxLength={20}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Notes */}
      <FormSection
        title="Notes"
        description="Any additional information about this customer.">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="customerNote">
            Customer Note <OptionalTag />
          </Label>
          <Textarea
            id="customerNote"
            name="customerNote"
            placeholder="e.g. Prefers emailed invoices, special delivery instructions..."
            rows={3}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/customers">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating...' : 'Create Customer'}
        </Button>
      </div>
    </form>
  );
}
