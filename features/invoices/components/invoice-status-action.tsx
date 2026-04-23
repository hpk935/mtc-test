'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updateInvoiceStatus } from '../actions';
import { type InvoiceStatus } from '@/features/invoices/constants';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  open: 'Open',
  paid: 'Paid',
  partially_paid: 'Partial',
  voided: 'Voided',
};

const STATUS_VARIANT: Record<
  InvoiceStatus,
  'info' | 'warning' | 'success' | 'destructive'
> = {
  open: 'info',
  paid: 'success',
  partially_paid: 'warning',
  voided: 'destructive',
};

// Note: 'paid' is never a manual transition target — it's applied automatically
// by the Account Receivables flow once the balance reaches zero.
const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  open: ['voided'],
  partially_paid: ['voided'],
  paid: ['open', 'voided'],
  voided: [],
};

interface InvoiceStatusActionProps {
  invoiceNumber: string;
  currentStatus: InvoiceStatus;
  hasPayments?: boolean;
}

export function InvoiceStatusAction({
  invoiceNumber,
  currentStatus,
  hasPayments = false,
}: InvoiceStatusActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<InvoiceStatus | null>(
    null,
  );

  // Lock status when fully paid via payments
  const allowedStatuses =
    currentStatus === 'paid' && hasPayments
      ? []
      : VALID_TRANSITIONS[currentStatus];

  function handleConfirm() {
    if (!pendingStatus) return;
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceNumber, pendingStatus);
      if (result.success) {
        toast.success(
          `Invoice status changed to ${STATUS_LABEL[pendingStatus].toLowerCase()}.`,
        );
        setPendingStatus(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (allowedStatuses.length === 0) {
    return (
      <Badge variant={STATUS_VARIANT[currentStatus]}>
        {STATUS_LABEL[currentStatus]}
      </Badge>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="focus-visible:ring-ring inline-flex cursor-pointer items-center gap-1 rounded-full focus-visible:ring-1 focus-visible:outline-none">
            <Badge variant={STATUS_VARIANT[currentStatus]}>
              {STATUS_LABEL[currentStatus]}
              <ChevronDown className="ml-1 size-3" />
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {allowedStatuses.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => {
                setPendingStatus(status);
              }}>
              <Badge variant={STATUS_VARIANT[status]} className="font-normal">
                {STATUS_LABEL[status]}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={!!pendingStatus}
        onOpenChange={(open) => {
          if (!open) {
            setPendingStatus(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Invoice Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change invoice{' '}
              <span className="font-medium">{invoiceNumber}</span> from{' '}
              <Badge
                variant={STATUS_VARIANT[currentStatus]}
                className="mx-0.5 align-middle">
                {STATUS_LABEL[currentStatus]}
              </Badge>{' '}
              to{' '}
              {pendingStatus && (
                <Badge
                  variant={STATUS_VARIANT[pendingStatus]}
                  className="mx-0.5 align-middle">
                  {STATUS_LABEL[pendingStatus]}
                </Badge>
              )}
              ?
              {pendingStatus === 'voided' && (
                <span className="mt-2 block text-sm font-medium text-red-600">
                  This action cannot be undone.
                </span>
              )}
              {pendingStatus === 'paid' && (
                <span className="mt-2 block text-sm font-medium text-amber-600">
                  Once fully paid, the status cannot be changed.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingStatus(null);
              }}
              disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant={pendingStatus === 'voided' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={isPending}>
              {isPending ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
