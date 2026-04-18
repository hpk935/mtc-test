'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
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
import { PRODUCT_TYPES, UNITS_SOLD_BY } from '../constants';
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
}

export function ProductForm({ product, mode = 'create' }: ProductFormProps) {
  const action = mode === 'edit' ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = mode === 'edit';

  const buildInitialValues = () => ({
    itemNumber: product?.itemNumber ?? '',
    description: product?.description ?? '',
    cartonNumber: product?.cartonNumber ?? '',
    unitSoldBy: product?.unitSoldBy ?? '',
    minQty: String(product?.minQty ?? 0),
    maxQty: String(product?.maxQty ?? 0),
    productType: product?.productType ?? '',
    dimensionsL: product?.dimensionsL ?? '0',
    dimensionsW: product?.dimensionsW ?? '0',
    dimensionsH: product?.dimensionsH ?? '0',
    cubicFeet: product?.cubicFeet ?? '0',
    caseWeight: product?.caseWeight ?? '0',
    upcNumber: product?.upcNumber ?? '',
    landedCost: product?.landedCost ?? '0',
    minimumPackPrice: product?.minimumPackPrice ?? '0',
    casePrice: product?.casePrice ?? '0',
    qtyInStock: String(product?.qtyInStock ?? 0),
    qtyCommitted: String(product?.qtyCommitted ?? 0),
    qtyAvailable: String(product?.qtyAvailable ?? 0),
    qtyOnOrder: String(product?.qtyOnOrder ?? 0),
    upcomingShipmentNo: product?.upcomingShipmentNo ?? '',
    upcomingShipmentArrival: product?.upcomingShipmentArrival ?? '',
    upcomingShipmentQty: String(product?.upcomingShipmentQty ?? ''),
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
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const formValuesRef = useRef(formValues);

  useEffect(() => {
    formValuesRef.current = formValues;
  });

  useEffect(() => {
    if (state.success && isEdit) {
      setSavedValues({ ...formValuesRef.current });
      toast.success('Product updated successfully.');
    } else if (!state.success && state.error) {
      toast.error(state.error);
    }
  }, [state, isEdit]);

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
          <Label htmlFor="productType">Product Type</Label>
          <Select
            name="productType"
            required
            value={formValues.productType}
            onValueChange={(v) => handleSelectChange('productType', v)}>
            <SelectTrigger id="productType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            value={formValues.maxQty}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimensionsL">Length</Label>
          <Input
            id="dimensionsL"
            name="dimensionsL"
            placeholder="0.00"
            value={formValues.dimensionsL}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimensionsW">Width</Label>
          <Input
            id="dimensionsW"
            name="dimensionsW"
            placeholder="0.00"
            value={formValues.dimensionsW}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimensionsH">Height</Label>
          <Input
            id="dimensionsH"
            name="dimensionsH"
            placeholder="0.00"
            value={formValues.dimensionsH}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cubicFeet">Cubic Feet (per master box)</Label>
          <Input
            id="cubicFeet"
            name="cubicFeet"
            placeholder="0.0000"
            value={formValues.cubicFeet}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="caseWeight">Case Weight (per master box)</Label>
          <Input
            id="caseWeight"
            name="caseWeight"
            placeholder="0.00"
            value={formValues.caseWeight}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitSoldBy">Unit Sold By</Label>
          <Select
            name="unitSoldBy"
            required
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
            value={formValues.casePrice}
            onChange={handleChange}
          />
        </div>
      </FormSection>

      <Separator />

      {/* Inventory */}
      <FormSection
        title="Inventory"
        description="Current stock levels and incoming shipment details.">
        <div className="space-y-2">
          <Label htmlFor="qtyInStock">Qty In Stock</Label>
          <Input
            id="qtyInStock"
            name="qtyInStock"
            type="number"
            min={0}
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
            min={0}
            value={formValues.qtyOnOrder}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="upcomingShipmentNo">
            Upcoming Shipment No. <OptionalTag />
          </Label>
          <Input
            id="upcomingShipmentNo"
            name="upcomingShipmentNo"
            placeholder="e.g. SH-2024-001"
            value={formValues.upcomingShipmentNo}
            onChange={handleChange}
            maxLength={20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="upcomingShipmentArrival">
            Shipment Arrival Date <OptionalTag />
          </Label>
          <Input
            id="upcomingShipmentArrival"
            name="upcomingShipmentArrival"
            type="date"
            value={formValues.upcomingShipmentArrival}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="upcomingShipmentQty">
            Shipment Qty <OptionalTag />
          </Label>
          <Input
            id="upcomingShipmentQty"
            name="upcomingShipmentQty"
            type="number"
            min={0}
            value={formValues.upcomingShipmentQty}
            onChange={handleChange}
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
    </form>
  );
}
