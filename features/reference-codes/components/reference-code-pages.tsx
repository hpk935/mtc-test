import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTableFilter } from '@/components/data/data-table-filter';
import { NotFoundState } from '@/components/layout/not-found-state';
import { requireAdmin } from '@/lib/auth';
import { REFERENCE_CODE_KIND, decodeCodeParam } from '../constants';
import type { ReferenceCodeKind } from '../constants';
import {
  findReferenceCode,
  isReferenceCodeInUse,
  listReferenceCodes,
} from '../queries';
import { ReferenceCodeTable } from './reference-code-table';
import { ReferenceCodeForm } from './reference-code-form';
import { ReferenceCodeActions } from './reference-code-actions';

// Shared bodies for the payment term, territory and freight term routes, which
// differ only in their kind.

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="ghost" size="sm" asChild className="w-fit">
      <Link href={href}>
        <ArrowLeft className="mr-2 size-4" />
        {label}
      </Link>
    </Button>
  );
}

export async function ReferenceCodeListPage({
  kind,
  searchParams,
}: {
  kind: ReferenceCodeKind;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const config = REFERENCE_CODE_KIND[kind];
  const { status = 'active' } = await searchParams;

  const isActive =
    status === 'active' ? true : status === 'inactive' ? false : undefined;
  const codes = await listReferenceCodes(kind, isActive);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{config.plural}</h1>
          <p className="text-muted-foreground text-sm">{config.summary}</p>
        </div>
        <Button asChild>
          <Link href={`${config.path}/new`}>
            <Plus className="mr-2 size-4" />
            New {config.singular}
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <DataTableFilter
          options={statusOptions}
          paramName="status"
          defaultValue="active"
          allLabel="All"
        />
      </div>
      <div className="rounded-lg border">
        <ReferenceCodeTable kind={kind} codes={codes} />
      </div>
    </div>
  );
}

export async function NewReferenceCodePage({
  kind,
}: {
  kind: ReferenceCodeKind;
}) {
  await requireAdmin();
  const config = REFERENCE_CODE_KIND[kind];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <BackLink href={config.path} label={`Back to ${config.plural}`} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          New {config.singular}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{config.summary}</p>
      </div>
      <ReferenceCodeForm kind={kind} />
    </div>
  );
}

export async function EditReferenceCodePage({
  kind,
  params,
}: {
  kind: ReferenceCodeKind;
  params: Promise<{ code: string }>;
}) {
  await requireAdmin();
  const config = REFERENCE_CODE_KIND[kind];
  const code = decodeCodeParam((await params).code);

  const [record, inUse] = await Promise.all([
    findReferenceCode(kind, code),
    isReferenceCodeInUse(kind, code),
  ]);
  if (!record) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <BackLink href={config.path} label={`Back to ${config.plural}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Edit {config.singular} {record.code}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {inUse
              ? 'In use by customers, orders or invoices, so it can be deactivated but not deleted.'
              : 'Not used by any customer, order or invoice.'}
          </p>
        </div>
        <ReferenceCodeActions
          kind={kind}
          code={record.code}
          isActive={record.isActive}
          inUse={inUse}
        />
      </div>
      <ReferenceCodeForm
        key={String(record.updatedAt)}
        kind={kind}
        record={record}
      />
    </div>
  );
}

export function ReferenceCodeNotFound({ kind }: { kind: ReferenceCodeKind }) {
  const config = REFERENCE_CODE_KIND[kind];
  return (
    <NotFoundState
      title={`${config.singular} not found`}
      description={`This ${config.singular.toLowerCase()} doesn't exist or the link is incorrect.`}
      backHref={config.path}
      backLabel={`Back to ${config.plural}`}
    />
  );
}
