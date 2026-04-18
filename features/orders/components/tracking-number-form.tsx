'use client';

import { useRef, useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateTrackingNumber } from '@/features/orders/actions';
import { toast } from 'sonner';

interface TrackingNumberFormProps {
  orderNumber: string;
  trackingNumber: string | null;
}

export function TrackingNumberForm({
  orderNumber,
  trackingNumber,
}: TrackingNumberFormProps) {
  const [value, setValue] = useState(trackingNumber ?? '');
  const [isPending, startTransition] = useTransition();
  const savedValue = useRef(trackingNumber ?? '');

  const isDirty = value !== savedValue.current;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateTrackingNumber(orderNumber, formData);
      if (result.success) {
        savedValue.current = value;
        toast.success('Tracking number updated.');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex gap-2">
      <Input
        name="trackingNumber"
        placeholder="Enter tracking number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={100}
        className="h-8 text-sm"
      />
      {isDirty && (
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      )}
    </form>
  );
}
