'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Pencil, UserX, UserCheck } from 'lucide-react';
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
import { toggleUserActive } from '../actions';

interface UserActionsProps {
  userId: number;
  isActive: boolean;
}

export function UserActions({ userId, isActive }: UserActionsProps) {
  const [toggleOpen, setToggleOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggle() {
    setIsToggling(true);
    const result = await toggleUserActive(userId);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(isActive ? 'User deactivated.' : 'User activated.');
      setToggleOpen(false);
    }
    setIsToggling(false);
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/users/${userId}/edit`}>
          <Pencil className="mr-2 size-4" />
          Edit
        </Link>
      </Button>

      <Dialog open={toggleOpen} onOpenChange={setToggleOpen}>
        <DialogTrigger asChild>
          <Button variant={isActive ? 'destructive' : 'default'} size="sm">
            {isActive ? (
              <>
                <UserX className="mr-2 size-4" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="mr-2 size-4" />
                Activate
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isActive ? 'Deactivate User' : 'Activate User'}
            </DialogTitle>
            <DialogDescription>
              {isActive
                ? 'This user will no longer be able to log in. You can reactivate them later.'
                : 'This will allow the user to log in again.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToggleOpen(false)}
              disabled={isToggling}>
              Cancel
            </Button>
            <Button
              variant={isActive ? 'destructive' : 'default'}
              onClick={handleToggle}
              disabled={isToggling}>
              {isToggling
                ? 'Processing...'
                : isActive
                  ? 'Deactivate'
                  : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
