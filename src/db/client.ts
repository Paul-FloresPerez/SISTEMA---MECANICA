import 'server-only';

import { Pool, neon, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzleWebSocket } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

import { databaseUrl } from './env';
import * as schema from './schema';

const httpClient = neon(databaseUrl);

/** Queries and isolated one-statement operations over Neon HTTP. */
export const dbQuery = drizzleHttp({ client: httpClient, schema });

// Interactive transactions need the WebSocket driver in the Node.js runtime.
neonConfig.webSocketConstructor = ws;

const globalForDatabase = globalThis as typeof globalThis & {
  neonTransactionPool?: Pool;
};

const transactionPool = globalForDatabase.neonTransactionPool ?? new Pool({ connectionString: databaseUrl });

if (process.env.NODE_ENV !== 'production') {
  globalForDatabase.neonTransactionPool = transactionPool;
}

/**
 * Database client for short interactive transactions only. Callers must use
 * dbTx.transaction() for inventory, payments and document state changes.
 */
export const dbTx = drizzleWebSocket({ client: transactionPool, schema });
