'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ban, FileText, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteOrder, voidOrder, postToInvoice } from '../actions';

interface OrderActionsProps {
  orderNumber: string;
  orderStatus: string;
}

export function OrderActions({ orderNumber, orderStatus }: OrderActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');

  if (orderStatus !== 'open') return null;

  async function handleDelete() {
    setIsDeleting(true);
    setError('');
    const result = await deleteOrder(orderNumber);
    if (!result.success) {
      setError(result.error);
      setIsDeleting(false);
    }
    // redirect happens in the action on success
  }

  async function handlePost() {
    setIsPosting(true);
    setError('');
    const result = await postToInvoice(orderNumber);
    if (!result.success) {
      setError(result.error);
      setIsPosting(false);
    }
    // redirect happens in the action on success
  }

  async function handleVoid() {
    setIsVoiding(true);
    setError('');
    const result = await voidOrder(orderNumber);
    if (!result.success) {
      setError(result.error);
      setIsVoiding(false);
    } else {
      setVoidOpen(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/orders/${orderNumber}/edit`}>
          <Pencil className="mr-2 size-4" />
          Edit
        </Link>
      </Button>

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <FileText className="mr-2 size-4" />
            Post to Invoice
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post to Invoice</DialogTitle>
            <DialogDescription>
              This will create an invoice from order {orderNumber} and mark the
              order as invoiced. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPostOpen(false)}
              disabled={isPosting}>
              Cancel
            </Button>
            <Button onClick={handlePost} disabled={isPosting}>
              {isPosting ? 'Posting...' : 'Post to Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Ban className="mr-2 size-4" />
            Void
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to void order {orderNumber}? The order will
              be kept for records but can no longer be edited, deleted, or
              invoiced.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVoidOpen(false)}
              disabled={isVoiding}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={isVoiding}>
              {isVoiding ? 'Voiding...' : 'Void Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order {orderNumber}? This will
              permanently remove the order and all its line items. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
