# Data Import Scripts

This directory contains one-time or repeatable scripts for importing data from legacy systems.

## Pattern

Each import script should:

1. Read source data (CSV, JSON, or direct DB query from legacy system)
2. Validate each record with the appropriate Zod schema from `src/features/{feature}/validation.ts`
3. Insert valid records into the database
4. Log skipped/invalid records for manual review

## Example Usage

```bash
npx tsx scripts/import/import-customers.ts ./data/customers.csv
```

## Conventions

- One script per entity/import source
- Always validate before inserting
- Log results (imported count, skipped count, errors)
- Idempotent where possible (check for existing records before inserting)
