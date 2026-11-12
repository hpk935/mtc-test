import { MongoClient, type Db } from 'mongodb';

// The storefront (the public web shop) keeps its orders and carts in its own
// MongoDB. We read them live from there, never write, and keep everything
// else in Postgres (lib/db.ts). The database is the one named in MONGODB_URI.

declare global {
    var storefrontMongo: Promise<MongoClient> | undefined;
}

/** The storefront's database. One client is shared across hot reloads. */
export async function storefrontDb(): Promise<Db> {
    if (!globalThis.storefrontMongo) {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('Please define MONGODB_URI in .env.local');
        }
        globalThis.storefrontMongo = new MongoClient(uri).connect();
        // Let the next request retry instead of reusing a failed connect.
        globalThis.storefrontMongo.catch(() => {
            globalThis.storefrontMongo = undefined;
        });
    }
    const client = await globalThis.storefrontMongo;
    return client.db();
}
