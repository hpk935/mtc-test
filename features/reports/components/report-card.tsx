import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ReportCardProps {
  href: string;
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function ReportCard({
  href,
  title,
  description,
  icon: Icon,
}: ReportCardProps) {
  return (
    <Link
      href={href}
      className="group hover:border-foreground/30 hover:bg-muted/40 flex items-start gap-4 rounded-lg border p-4 transition-colors">
      {Icon && (
        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
      </div>
      <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 self-center" />
    </Link>
  );
}
