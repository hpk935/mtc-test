export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerNumber: string }>;
}) {
  const { customerNumber } = await params;

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Customer {customerNumber}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Customer details and history
        </p>
      </div>
      <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
        Customer detail view coming soon.
      </div>
    </div>
  );
}
