'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [ref, setRef] = useState('');

  function resetForm() {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
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
                max={balanceDue}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
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
