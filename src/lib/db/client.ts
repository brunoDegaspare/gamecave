type DbClient = {
  query: <T = unknown>(
    sql: string,
    params?: Array<unknown>,
  ) => Promise<{ rows: T[] }>;
};

let cachedClient: DbClient | null = null;

export const getDbClient = async (): Promise<DbClient | null> => {
  if (cachedClient) {
    return cachedClient;
  }

  const globalClient = (globalThis as { gamecaveDb?: DbClient }).gamecaveDb;
  if (globalClient) {
    cachedClient = globalClient;
    return cachedClient;
  }

  const fallbackClient = (globalThis as { db?: DbClient }).db;
  if (fallbackClient) {
    cachedClient = fallbackClient;
    (globalThis as { gamecaveDb?: DbClient }).gamecaveDb = fallbackClient;
    return cachedClient;
  }

  return null;
};

export type { DbClient };
