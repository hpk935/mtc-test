'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { createProduct, updateProduct } from '../actions';
import { UNITS_SOLD_BY } from '../constants';
import type { Product } from '../types';
import type { ActionResult } from '@/types';

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function OptionalTag() {
  return (
    <span className="text-muted-foreground ml-1 text-xs font-normal">
      (optional)
    </span>
  );
}

const initialState: ActionResult = { success: false, error: '' };

interface ProductFormProps {
  product?: Product;
  mode?: 'create' | 'edit';
  readOnly?: boolean;
}

export function ProductForm({
  product,
  mode = 'create',
  readOnly,
}: ProductFormProps) {
  const serverAction = mode === 'edit' ? updateProduct : createProduct;
  const isEdit = mode === 'edit';

  async function actionWithToast(
    _prevState: ActionResult,
    formData: FormData,
  ): Promise<ActionResult> {
    const result = await serverAction(_prevState, formData);
    if (result.success && isEdit) {
      toast.success('Product updated successfully.');
    } else if (!result.success && result.error) {
      toast.error(result.error);
    }
    return result;
  }

  const [state, formAction, pending] = useActionState(
    actionWithToast,
    initialState,
  );

  const buildInitialValues = () => ({
    itemNumber: product?.itemNumber ?? '',
    description: product?.description ?? '',
    cartonNumber: product?.cartonNumber ?? '',
    unitSoldBy: product?.unitSoldBy ?? '',
    minQty: product?.minQty != null ? String(product.minQty) : '',
    maxQty: product?.maxQty != null ? String(product.maxQty) : '',
    productType: product?.productType ?? '',
    dimensionsL: product?.dimensionsL ?? '',
    dimensionsW: product?.dimensionsW ?? '',
    dimensionsH: product?.dimensionsH ?? '',
    cubicFeet: product?.cubicFeet ?? '',
    caseWeight: product?.caseWeight ?? '',
    upcNumber: product?.upcNumber ?? '',
    landedCost: product?.landedCost ?? '',
    minimumPackPrice: product?.minimumPackPrice ?? '',
    casePrice: product?.casePrice ?? '',
    qtyInStock: product?.qtyInStock != null ? String(product.qtyInStock) : '',
    qtyCommitted:
      product?.qtyCommitted != null ? String(product.qtyCommitted) : '',
    qtyAvailable:
      product?.qtyAvailable != null ? String(product.qtyAvailable) : '',
    qtyOnOrder: product?.qtyOnOrder != null ? String(product.qtyOnOrder) : '',
    nob: String(product?.nob ?? ''),
    isDiscontinued: product?.isDiscontinued ?? false,
    htsCode: product?.htsCode ?? '',
    leadTime: product?.leadTime ?? '',
  });

  const [formValues, setFormValues] = useState(buildInitialValues);
  const [savedValues, setSavedValues] = useState(buildInitialValues);

  const isDirty =
    isEdit &&
    Object.keys(savedValues).some(
      (key) =>
        String(formValues[key as keyof typeof formValues]) !==
        String(savedValues[key as keyof typeof savedValues]),
    );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => {
      const next = { ...prev, [name]: value };
      if (
        name === 'dimensionsL' ||
        name === 'dimensionsW' ||
        name === 'dimensionsH'
      ) {
        if (next.dimensionsL && next.dimensionsW && next.dimensionsH) {
          const l = parseFloat(next.dimensionsL) || 0;
          const w = parseFloat(next.dimensionsW) || 0;
          const h = parseFloat(next.dimensionsH) || 0;
          next.cubicFeet = ((l * w * h) / 1728).toFixed(4);
        } else {
          next.cubicFeet = '';
        }
      }
      return next;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form action={formAction} className="space-y-8">
      {isEdit && product && (
        <input type="hidden" name="productId" value={product.productId} />
      )}

      {/* Basic Information */}
      <FormSection
        title="Basic Information"
        description="Core product identifiers and description.">
        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="productId">Product ID</Label>
            <Input
              id="productId"
              value={product?.productId}
              readOnly
              disabled
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="itemNumber">Item Number</Label>
          <Input
            id="itemNumber"
            name="itemNumber"
            placeholder="e.g. 10001"
            value={formValues.itemNumber}
            onChange={handleChange}
            required
            maxLength={50}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            placeholder="Product description"
            value={formValues.description}
            onChange={handleChange}
            required
            maxLength={500}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cartonNumber">
            Carton Number <OptionalTag />
          </Label>
          <Input
            id="cartonNumber"
            name="cartonNumber"
            placeholder="e.g. CTN-100"
            value={formValues.cartonNumber}
            onChange={handleChange}
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="productType">
            Product Type <OptionalTag />
          </Label>
          <Input
            id="productType"
            name="productType"
            placeholder="e.g. A01"
            value={formValues.productType}
            onChange={handleChange}
            maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="upcNumber">
            UPC Number <OptionalTag />
          </Label>
          <Input
            id="upcNumber"
            name="upcNumber"
            placeholder="e.g. 012345678901"
            value={formValues.upcNumber}
            onChange={handleChange}
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="htsCode">
            HTS Code <OptionalTag />
          </Label>
          <Input
            id="htsCode"
            name="htsCode"
            placeholder="e.g. 9503.00.0090"
            value={formValues.htsCode}
            onChange={handleChange}
            maxLength={20}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Case Packs & Dimensions */}
      <FormSection
        title="Case Packs & Dimensions"
        description="Inner/master case pack quantities and physical dimensions.">
        <div className="space-y-2">
          <Label htmlFor="minQty">Inner Case Pack</Label>
          <Input
            id="minQty"
            name="minQty"
            type="number"
            min={0}
            step={1}
            required
            value={formValues.minQty}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxQty">Master Case Pack</Label>
          <Input
            id="maxQty"
            name="maxQty"
            type="number"
            min={0}
            step={1}
            required
            value={formValues.maxQty}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimensionsL">Length (in)</Label>
          <Input
            id="dimensionsL"
            name="dimensionsL"
            placeholder="0.00"
            required
            inputMode="decimal"
            value={formValues.dimensionsL}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimensionsW">Width (in)</Label>
          <Input
            id="dimensionsW"
            name="dimensionsW"
            placeholder="0.00"
            required
            inputMode="decimal"
            value={formValues.dimensionsW}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimensionsH">Height (in)</Label>
          <Input
            id="dimensionsH"
            name="dimensionsH"
            placeholder="0.00"
            required
            inputMode="decimal"
            value={formValues.dimensionsH}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cubicFeet">Cubic Feet (per master box) (ft³)</Label>
          <input type="hidden" name="cubicFeet" value={formValues.cubicFeet} />
          <Input
            id="cubicFeet"
            placeholder="0.0000"
            value={formValues.cubicFeet}
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="caseWeight">Case Weight (per master box) (lbs)</Label>
          <Input
            id="caseWeight"
            name="caseWeight"
            placeholder="0.00"
            required
            inputMode="decimal"
            value={formValues.caseWeight}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitSoldBy">Unit Sold By</Label>
          {/* Hidden input drives FormData. Radix Select's built-in `name`
              prop falls back to the first <option> when value is '',
              which silently bypasses required validation. */}
          <input
            type="hidden"
            name="unitSoldBy"
            value={formValues.unitSoldBy}
          />
          <Select
            value={formValues.unitSoldBy}
            onValueChange={(v) => handleSelectChange('unitSoldBy', v)}>
            <SelectTrigger id="unitSoldBy">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {UNITS_SOLD_BY.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FormSection>

      <Separator />

      {/* Pricing */}
      <FormSection
        title="Pricing"
        description="Cost and pricing information for this product.">
        <div className="space-y-2">
          <Label htmlFor="landedCost">Landed Cost</Label>
          <Input
            id="landedCost"
            name="landedCost"
            placeholder="0.00"
            required
            inputMode="decimal"
            value={formValues.landedCost}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimumPackPrice">Inner Case Price</Label>
          <Input
            id="minimumPackPrice"
            name="minimumPackPrice"
            placeholder="0.00"
            required
            inputMode="decimal"
            value={formValues.minimumPackPrice}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="casePrice">Case Price</Label>
          <Input
            id="casePrice"
            name="casePrice"
            placeholder="0.00"
            required
            inputMode="decimal"
            value={formValues.casePrice}
            onChange={handleChange}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Inventory */}
      <FormSection
        title="Inventory"
        description="Current stock levels. Qty On Order is derived from open purchase orders.">
        <div className="space-y-2">
          <Label htmlFor="qtyInStock">Qty In Stock</Label>
          <Input
            id="qtyInStock"
            name="qtyInStock"
            type="number"
            min={0}
            step={1}
            required
            value={formValues.qtyInStock}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qtyCommitted">Qty Committed</Label>
          <Input
            id="qtyCommitted"
            type="number"
            value={formValues.qtyCommitted}
            readOnly
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qtyAvailable">Qty Available</Label>
          <Input
            id="qtyAvailable"
            type="number"
            value={
              Number(formValues.qtyInStock) - Number(formValues.qtyCommitted)
            }
            readOnly
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qtyOnOrder">Qty On Order</Label>
          <Input
            id="qtyOnOrder"
            name="qtyOnOrder"
            type="number"
            value={formValues.qtyOnOrder}
            readOnly
            disabled
          />
        </div>
      </FormSection>

      <Separator />

      {/* Additional Details */}
      <FormSection
        title="Additional Details"
        description="NOB, lead time, and product status.">
        <div className="space-y-2">
          <Label htmlFor="nob">
            NOB <OptionalTag />
          </Label>
          <Input
            id="nob"
            name="nob"
            type="number"
            min={0}
            placeholder="Vendor order placeholder"
            value={formValues.nob}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leadTime">
            Lead Time <OptionalTag />
          </Label>
          <Input
            id="leadTime"
            name="leadTime"
            placeholder="e.g. 4-6 weeks"
            value={formValues.leadTime}
            onChange={handleChange}
            maxLength={50}
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox
            id="isDiscontinued"
            name="isDiscontinued"
            checked={formValues.isDiscontinued}
            onCheckedChange={(checked) =>
              setFormValues((prev) => ({
                ...prev,
                isDiscontinued: checked === true,
              }))
            }
          />
          {formValues.isDiscontinued && (
            <input type="hidden" name="isDiscontinued" value="true" />
          )}
          <Label htmlFor="isDiscontinued" className="text-sm font-normal">
            This product is discontinued
          </Label>
        </div>
      </FormSection>

      <Separator />

      {/* Actions */}
      {!readOnly && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={pending || (isEdit && !isDirty)}>
            {pending
              ? isEdit
                ? 'Saving...'
                : 'Creating...'
              : isEdit
                ? 'Save Changes'
                : 'Create Product'}
          </Button>
        </div>
      )}
    </form>
  );
}
