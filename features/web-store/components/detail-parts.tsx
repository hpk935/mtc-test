import { ImageOff } from 'lucide-react';

// Pieces shared by the web order and web cart detail views.

export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium break-all">{children}</span>
    </div>
  );
}

/** Product image (from the shop's CDN), name and SKU for a line item. */
export function ProductSummary({
  name,
  sku,
  imageUrl,
}: {
  name: string;
  sku: string;
  imageUrl?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-background flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="size-full object-contain" />
        ) : (
          <ImageOff className="text-muted-foreground size-4" />
        )}
      </div>
      <div className="min-w-0">
        <p className="max-w-72 truncate font-medium">{name}</p>
        <p className="text-muted-foreground text-xs">SKU {sku}</p>
      </div>
    </div>
  );
}
