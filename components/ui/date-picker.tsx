'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface DatePickerProps {
  /** ISO date string `YYYY-MM-DD` */
  value?: string;
  /** Receives `YYYY-MM-DD` or empty string when cleared */
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** Set true when used inside a Dialog to fix Firefox/Safari/iOS visibility */
  modal?: boolean;
  /** Accessible label for the trigger button */
  'aria-label'?: string;
}

const ISO_FORMAT = 'yyyy-MM-dd';
const DISPLAY_FORMAT = 'PP'; // e.g. "Apr 26, 2026"

function parseISODate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, ISO_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  className,
  id,
  modal = false,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseISODate(value);

  function handleSelect(date: Date | undefined) {
    onChange?.(date ? format(date, ISO_FORMAT) : '');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, DISPLAY_FORMAT) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
