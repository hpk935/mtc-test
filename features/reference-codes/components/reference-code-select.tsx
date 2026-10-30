'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReferenceCodeOption } from '../types';

interface ReferenceCodeSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: ReferenceCodeOption[];
  value: string;
  onValueChange: (code: string) => void;
  /** Set when the value is submitted through FormData. */
  name?: string;
}

export function ReferenceCodeSelect({
  id,
  label,
  placeholder,
  options,
  value,
  onValueChange,
  name,
}: ReferenceCodeSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {/* Hidden input drives FormData. Radix Select's built-in `name`
          prop falls back to the first <option> when value is '',
          which silently bypasses required validation. */}
      {name && <input type="hidden" name={name} value={value} />}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
