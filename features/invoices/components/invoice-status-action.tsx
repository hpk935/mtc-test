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
  posted: 'Posted',
  paid: 'Paid',
  voided: 'Voided',
};

const STATUS_VARIANT: Record<
  InvoiceStatus,
  'default' | 'secondary' | 'destructive'
> = {
  posted: 'secondary',
  paid: 'default',
  voided: 'destructive',
};

const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  posted: ['paid', 'voided'],
  paid: ['posted', 'voided'],
  voided: [],
};

interface InvoiceStatusActionProps {
  invoiceNumber: string;
  currentStatus: InvoiceStatus;
}

export function InvoiceStatusAction({
  invoiceNumber,
  currentStatus,
}: InvoiceStatusActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<InvoiceStatus | null>(
    null,
  );

  const allowedStatuses = VALID_TRANSITIONS[currentStatus];

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
