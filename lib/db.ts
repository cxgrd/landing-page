import { Pool, type QueryResult } from 'pg';

let pool: Pool | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getSslConfig(connectionString: string): { rejectUnauthorized: boolean } | undefined {
  if (connectionString.includes('supabase.co')) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: getSslConfig(connectionString),
    });
  }

  return pool;
}

export async function dbQuery<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult> {
  return getPool().query(text, params);
}
