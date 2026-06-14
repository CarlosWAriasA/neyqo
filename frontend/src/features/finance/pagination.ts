import type { PaginatedResponse } from '../../types/financial';

export function flattenPages<T>(pages: Array<PaginatedResponse<T>> | undefined): T[] {
  return pages?.flatMap((page) => page.items) ?? [];
}
