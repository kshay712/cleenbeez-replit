import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Create the connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// For use in production environments
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Close the connection when the process exits
process.on('exit', () => {
  client.end();
});
