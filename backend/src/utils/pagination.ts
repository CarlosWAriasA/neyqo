import { z } from 'zod';

export interface PageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface PaginationInput {
  limit: number;
  cursor?: string;
}

export function buildPaginationSchema(defaultLimit: number) {
  return z.object({
    limit: z.coerce.number().int().min(1).max(100).default(defaultLimit),
    cursor: z.string().min(1).optional(),
  });
}

export function encodeCursor(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

export function decodeCursor<T>(cursor: string | undefined, schema: z.ZodType<T>): T | null {
  if (!cursor) {
    return null;
  }

  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    return schema.parse(JSON.parse(raw));
  } catch {
    throw new Error('INVALID_CURSOR');
  }
}

export function toPaginatedResponse<T>(
  rows: T[],
  limit: number,
  getCursor: (item: T) => string,
): PaginatedResponse<T> {
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const lastItem = items.at(-1);

  return {
    items,
    pageInfo: {
      nextCursor: hasNextPage && lastItem ? getCursor(lastItem) : null,
      hasNextPage,
      limit,
    },
  };
}
