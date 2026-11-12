'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Ban, CircleCheck, Trash2 } from 'lucide-react';
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
import { REFERENCE_CODE_KIND } from '../constants';
import type { ReferenceCodeKind } from '../constants';
import { deleteReferenceCode, toggleReferenceCodeActive } from '../actions';

interface ReferenceCodeActionsProps {
  kind: ReferenceCodeKind;
  code: string;
  isActive: boolean;
  /** Codes held by any customer, order or invoice can only be deactivated. */
  inUse: boolean;
}

export function ReferenceCodeActions({
  kind,
  code,
  isActive,
  inUse,
}: ReferenceCodeActionsProps) {
  const { singular } = REFERENCE_CODE_KIND[kind];
  const [toggleOpen, setToggleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  async function handleToggle() {
    setIsWorking(true);
    const result = await toggleReferenceCodeActive(kind, code);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(
        isActive ? `${singular} deactivated.` : `${singular} activated.`,
      );
      setToggleOpen(false);
    }
    setIsWorking(false);
  }

  async function handleDelete() {
    setIsWorking(true);
    // Redirects to the list on success.
    const result = await deleteReferenceCode(kind, code);
    if (result && !result.success) {
      toast.error(result.error);
      setIsWorking(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Dialog open={toggleOpen} onOpenChange={setToggleOpen}>
        <DialogTrigger asChild>
          <Button variant={isActive ? 'outline' : 'default'} size="sm">
            {isActive ? (
              <>
                <Ban className="mr-2 size-4" />
                Deactivate
              </>
            ) : (
              <>
                <CircleCheck className="mr-2 size-4" />
                Activate
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isActive ? `Deactivate ${singular}` : `Activate ${singular}`}
            </DialogTitle>
            <DialogDescription>
              {isActive
                ? `"${code}" will no longer be offered on new customers or orders. Records that already use it keep it. You can reactivate it later.`
                : `"${code}" will be offered on customers and orders again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToggleOpen(false)}
              disabled={isWorking}>
              Cancel
            </Button>
            <Button
              variant={isActive ? 'destructive' : 'default'}
              onClick={handleToggle}
              disabled={isWorking}>
              {isWorking
                ? 'Processing...'
                : isActive
                  ? 'Deactivate'
                  : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!inUse && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {singular}</DialogTitle>
              <DialogDescription>
                No customer, order or invoice uses &quot;{code}&quot;, so it can
                be deleted. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={isWorking}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isWorking}>
                {isWorking ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
