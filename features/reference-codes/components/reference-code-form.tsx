'use client';

import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { REFERENCE_CODE_KIND } from '../constants';
import type { ReferenceCodeKind } from '../constants';
import type { ReferenceCodeRecord } from '../types';
import type { ActionResult } from '@/types';
import { createReferenceCode, updateReferenceCode } from '../actions';

interface ReferenceCodeFormProps {
  kind: ReferenceCodeKind;
  /** Present when editing; the code itself can't be changed. */
  record?: ReferenceCodeRecord;
}

export function ReferenceCodeForm({ kind, record }: ReferenceCodeFormProps) {
  const config = REFERENCE_CODE_KIND[kind];
  const isEdit = !!record;

  const serverAction = isEdit
    ? updateReferenceCode.bind(null, kind, record.code)
    : createReferenceCode.bind(null, kind);

  async function actionWithToast(
    prevState: ActionResult,
    formData: FormData,
  ): Promise<ActionResult> {
    const result = await serverAction(prevState, formData);
    if (result.success && isEdit) {
      toast.success(`${config.singular} updated.`);
    } else if (!result.success && result.error) {
      toast.error(result.error);
    }
    return result;
  }

  const [, formAction, isPending] = useActionState(actionWithToast, {
    success: false,
    error: '',
  } as ActionResult);

  const initial = {
    code: record?.code ?? '',
    description: record?.description ?? '',
    netDays: record?.netDays?.toString() ?? '',
    isActive: String(record?.isActive ?? true),
  };
  const [values, setValues] = useState(initial);

  const isDirty =
    !isEdit ||
    values.description !== initial.description ||
    values.netDays !== initial.netDays ||
    values.isActive !== initial.isActive;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{config.singular} Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name={isEdit ? undefined : 'code'}
              value={values.code}
              onChange={handleChange}
              placeholder={config.codePlaceholder}
              maxLength={config.codeMaxLength}
              readOnly={isEdit}
              disabled={isEdit}
              required
            />
            {isEdit ? (
              <p className="text-muted-foreground text-xs">
                Codes can&apos;t be changed because customers, orders and
                invoices refer to them.
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Can&apos;t be changed later.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={values.description}
              onChange={handleChange}
              placeholder="Defaults to the code"
              maxLength={255}
            />
          </div>

          {config.hasNetDays && (
            <div className="space-y-2">
              <Label htmlFor="netDays">Net Days</Label>
              <Input
                id="netDays"
                name="netDays"
                type="number"
                inputMode="numeric"
                min={0}
                max={9999}
                step={1}
                value={values.netDays}
                onChange={handleChange}
                placeholder="e.g. 30"
              />
              <p className="text-muted-foreground text-xs">
                Days from the invoice date until payment is due. Use 0 for due
                on receipt. Required while the term is active.
              </p>
            </div>
          )}

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <input type="hidden" name="isActive" value={values.isActive} />
              <Select
                value={values.isActive}
                onValueChange={(v) =>
                  setValues((prev) => ({ ...prev, isActive: v }))
                }>
                <SelectTrigger id="isActive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Inactive codes stay on existing records but can&apos;t be chosen
                for new ones.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending
            ? isEdit
              ? 'Saving...'
              : 'Creating...'
            : isEdit
              ? 'Save Changes'
              : `Create ${config.singular}`}
        </Button>
      </div>
    </form>
  );
}
