import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './drizzle',
    schema: './features/**/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
