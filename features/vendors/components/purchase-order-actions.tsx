'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { todayIso } from '@/lib/dates';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  cancelPurchaseOrder,
  receivePurchaseOrderItems,
  submitPurchaseOrder,
  updatePurchaseOrderShipping,
} from '../actions';
import type { PurchaseOrderDetail } from '../queries';

export function PurchaseOrderActions({ po }: { po: PurchaseOrderDetail }) {
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setPending(true);
    const r = await submitPurchaseOrder(po.id);
    setPending(false);
    if (r.success) toast.success('Purchase order submitted.');
    else toast.error(r.error);
  }

  async function onCancel() {
    if (!confirm('Cancel this purchase order?')) return;
    setPending(true);
    const r = await cancelPurchaseOrder(po.id);
    setPending(false);
    if (r.success) toast.success('Purchase order cancelled.');
    else toast.error(r.error);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <ShippingDialog po={po} />
      {po.status === 'draft' && (
        <>
          <Button variant="outline" asChild disabled={pending}>
            <a href={`/purchase-orders/${po.id}/edit`}>Edit</a>
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            Submit
          </Button>
        </>
      )}
      {(po.status === 'ordered' || po.status === 'partially_received') && (
        <ReceiveDialog po={po} />
      )}
      {po.status !== 'received' && po.status !== 'cancelled' && (
        <Button variant="destructive" onClick={onCancel} disabled={pending}>
          Cancel PO
        </Button>
      )}
    </div>
  );
}

/** Vessel, departed date and vendor invoice no. are known after the order
 *  is placed, so
 *  they stay editable in every status. */
function ShippingDialog({ po }: { po: PurchaseOrderDetail }) {
  const [open, setOpen] = useState(false);
  const [vessel, setVessel] = useState('');
  const [departedDate, setDepartedDate] = useState('');
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
  const [pending, setPending] = useState(false);

  // Prefill from the PO as it is now.
  function onOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setVessel(po.vessel ?? '');
      setDepartedDate(po.departedDate ?? '');
      setVendorInvoiceNumber(po.vendorInvoiceNumber ?? '');
    }
    setOpen(nextOpen);
  }

  async function onSave() {
    setPending(true);
    const r = await updatePurchaseOrderShipping(po.id, {
      vessel,
      departedDate,
      vendorInvoiceNumber,
    });
    setPending(false);
    if (r.success) {
      toast.success('Shipping details saved.');
      setOpen(false);
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Shipping Details</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shipping details — {po.poNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vessel">Vessel</Label>
            <Input
              id="vessel"
              value={vessel}
              maxLength={100}
              onChange={(e) => setVessel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departedDate">Departed</Label>
            <Input
              id="departedDate"
              type="date"
              value={departedDate}
              onChange={(e) => setDepartedDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendorInvoiceNumber">Vendor Inv. No.</Label>
            <Input
              id="vendorInvoiceNumber"
              value={vendorInvoiceNumber}
              maxLength={50}
              onChange={(e) => setVendorInvoiceNumber(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiveDialog({ po }: { po: PurchaseOrderDetail }) {
  const [open, setOpen] = useState(false);
  const [receivedDate, setReceivedDate] = useState(todayIso);
  const [qtyMap, setQtyMap] = useState<Record<number, string>>({});
  const [pending, setPending] = useState(false);

  // Prefill from the PO as it is now; it changes after each receipt.
  function onOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setQtyMap(
        Object.fromEntries(
          po.items.map((i) => {
            const remaining = Math.max(0, i.qtyOrdered - i.qtyReceived);
            return [i.id, remaining > 0 ? String(remaining) : ''];
          }),
        ),
      );
    }
    setOpen(nextOpen);
  }

  async function onReceive() {
    const lines = po.items
      .filter((i) => i.qtyOrdered - i.qtyReceived > 0)
      .map((i) => ({
        lineId: i.id,
        qtyToReceive: Math.max(0, Number(qtyMap[i.id] ?? 0)),
      }))
      .filter((l) => l.qtyToReceive > 0);
    if (lines.length === 0) {
      toast.error('Enter at least one qty to receive.');
      return;
    }
    setPending(true);
    const r = await receivePurchaseOrderItems({
      purchaseOrderId: po.id,
      receivedDate,
      lines,
    });
    setPending(false);
    if (r.success) {
      toast.success('Items received.');
      setOpen(false);
    } else {
      toast.error(r.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Receive Items</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receive items — {po.poNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receivedDate">Received Date</Label>
            <Input
              id="receivedDate"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {po.items.map((i) => {
              const remaining = i.qtyOrdered - i.qtyReceived;
              return (
                <div
                  key={i.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto_96px] items-center gap-3 rounded-md border p-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{i.itemNumber}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {i.description}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs whitespace-nowrap">
                    Ordered: {i.qtyOrdered}
                  </div>
                  <div className="text-muted-foreground text-xs whitespace-nowrap">
                    Remaining: {remaining}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={remaining}
                    value={qtyMap[i.id] ?? ''}
                    disabled={remaining <= 0}
                    onChange={(e) =>
                      setQtyMap((p) => ({
                        ...p,
                        [i.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onReceive} disabled={pending}>
            {pending ? 'Saving…' : 'Receive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
