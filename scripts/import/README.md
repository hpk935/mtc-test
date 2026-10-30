# Data Import Scripts

Scripts for importing legacy customer and ship-to address data from CSV into the production database.

Source CSVs live in `data/` at the project root.

## Scripts

### `import-customers.ts`

Imports customer records from `data/MTC Internal Data - Customers.csv`.

- Validates required fields (customer number, account open date)
- Truncates values to match schema column lengths
- Normalizes postal codes (zero-pads short US zips)
- Derives account status from Inactive/OnHold flags + "store closed" markers
- Auto-seeds placeholder salesperson users (FK requirement)
- Batched inserts (500/batch), idempotent via `onConflictDoNothing()`

```bash
# Preview what will happen (no DB writes)
npx tsx scripts/import/import-customers.ts --dry-run

# Import first 10 rows
npx tsx scripts/import/import-customers.ts --limit 10

# Full import
npx tsx scripts/import/import-customers.ts
```

### `import-ship-to-addresses.ts`

Imports ship-to addresses from `data/MTC Internal Data - ShipToAddresses.csv`.

- Validates customer exists in DB before inserting (FK check)
- Skips empty rows, note-like entries, and duplicates
- Marks first address per customer as favorite
- Handles closed locations via status detection
- Exports skipped rows to `data/skipped-ship-to-addresses.csv` on dry run

```bash
# Preview (exports skipped rows CSV)
npx tsx scripts/import/import-ship-to-addresses.ts --dry-run

# Full import
npx tsx scripts/import/import-ship-to-addresses.ts

# Re-import skipped rows with corrected customer numbers
npx tsx scripts/import/import-ship-to-addresses.ts --fix-skipped
npx tsx scripts/import/import-ship-to-addresses.ts --fix-skipped --dry-run
```

### `cleanup-customers.ts`

Resets customer data for a fresh import. **Destructive** — truncates customers with CASCADE (deletes ship-to addresses, orders, invoices, receivables).

```bash
npx tsx scripts/import/cleanup-customers.ts
```

### `verify-customers.ts`

Quick spot-check after import: status distribution, salesperson count, sample record.

```bash
npx tsx scripts/import/verify-customers.ts
```

## Production Import Order

```bash
# 1. Run migrations
npm run db:migrate

# 2. Seed admin user
npm run db:seed

# 3. Apply term and territory definitions (edit reference-codes.ts first)
npx tsx scripts/import/seed-reference-codes.ts

# 4. Dry-run customers to review warnings and any new reference codes
npx tsx scripts/import/import-customers.ts --dry-run

# 5. Import customers
npx tsx scripts/import/import-customers.ts

# 6. Dry-run ship-to addresses (generates skipped CSV)
npx tsx scripts/import/import-ship-to-addresses.ts --dry-run

# 7. Import ship-to addresses
npx tsx scripts/import/import-ship-to-addresses.ts

# 8. Fix skipped ship-to rows with corrected customer numbers
npx tsx scripts/import/import-ship-to-addresses.ts --fix-skipped

# 9. Verify
npx tsx scripts/import/verify-customers.ts
```

Migrating an existing database keeps its codes but leaves every term inactive, so
run `seed-reference-codes.ts` straight after `db:migrate`. Until then the payment
terms dropdown has no options and new customers and orders can't be saved.

## Conventions

- One script per entity/import source
- Manual field validation with truncation warnings (not Zod — these handle messy legacy data)
- Log results (imported count, skipped count, warnings)
- Idempotent via `onConflictDoNothing()` — safe to re-run. `seed-reference-codes.ts` upserts instead, because `reference-codes.ts` is the source of truth for term definitions
