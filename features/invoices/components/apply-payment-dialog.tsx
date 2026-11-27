'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { todayIso } from '@/lib/dates';
import { roundCents } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { applyPayment } from '../actions';

function formatCurrency(value: string): string {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface ApplyPaymentDialogProps {
  invoiceNumber: string;
  totalAmount: string;
  balanceDue: string;
}

export function ApplyPaymentDialog({
  invoiceNumber,
  totalAmount,
  balanceDue,
}: ApplyPaymentDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => todayIso());
  const [ref, setRef] = useState('');

  // Paying more than the balance is allowed; the excess becomes credit.
  const excess = roundCents((Number(amount) || 0) - Number(balanceDue));

  function resetForm() {
    setAmount('');
    setDate(todayIso());
    setRef('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await applyPayment(
        invoiceNumber,
        amount,
        date,
        ref || undefined,
      );
      if (result.success) {
        toast.success('Payment applied successfully.');
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <DollarSign className="mr-1.5 size-3.5" />
          Apply Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Apply Payment</DialogTitle>
            <DialogDescription>
              Invoice {invoiceNumber} &middot; Total{' '}
              {formatCurrency(totalAmount)} &middot; Balance{' '}
              {formatCurrency(balanceDue)}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {excess > 0 && (
                <p
                  role="alert"
                  className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                  {formatCurrency(String(excess))} over the balance will be
                  recorded as customer credit, which can be applied to their
                  next order.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <DatePicker
                id="payment-date"
                value={date}
                onChange={setDate}
                modal
                aria-label="Payment Date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-ref">
                Reference{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="payment-ref"
                type="text"
                placeholder="Check #, transaction ID..."
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Applying...' : 'Apply Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
