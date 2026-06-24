import { Card } from '../ui/card';
import { Skeleton } from './Skeleton';

interface CardGridSkeletonProps {
  count?: number;
  variant?: 'compact' | 'standard' | 'detailed';
}

interface StatGridSkeletonProps {
  count?: number;
}

export function StatGridSkeleton({ count = 3 }: StatGridSkeletonProps) {
  return (
    <section className={count === 4 ? 'grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4' : 'grid grid-cols-3 gap-2 md:gap-4'}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="min-w-0 p-3 sm:p-5">
          <Skeleton className="h-4 w-4/5 max-w-32" />
          <Skeleton className="mt-2 h-6 w-3/5 max-w-24 sm:mt-3 sm:h-8" />
        </Card>
      ))}
    </section>
  );
}

export function CardGridSkeleton({ count = 6, variant = 'standard' }: CardGridSkeletonProps) {
  return (
    <section className="grid min-w-0 gap-4 pb-2 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <EntityCardSkeleton key={index} variant={variant} />
      ))}
    </section>
  );
}

export function TransactionListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      <Card className="hidden overflow-hidden p-0 lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-muted">
            <tr>
              {['w-16', 'w-36', 'w-32', 'w-28', 'w-20', 'w-24', 'w-24'].map((width, index) => (
                <th key={index} className="px-5 py-3">
                  <Skeleton className={`h-4 ${width}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <tr key={index} className="border-t border-border">
                <td className="px-5 py-4"><Skeleton className="h-6 w-20" /></td>
                <td className="px-5 py-4"><Skeleton className="h-5 w-40" /></td>
                <td className="px-5 py-4"><Skeleton className="h-5 w-36" /></td>
                <td className="px-5 py-4"><Skeleton className="h-5 w-28" /></td>
                <td className="px-5 py-4"><Skeleton className="h-5 w-24" /></td>
                <td className="px-5 py-4"><Skeleton className="ml-auto h-5 w-24" /></td>
                <td className="px-5 py-4"><Skeleton className="ml-auto h-9 w-32" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <section className="grid min-w-0 gap-3 lg:hidden">
        {Array.from({ length: Math.min(rows, 5) }).map((_, index) => (
          <EntityCardSkeleton key={index} variant="compact" />
        ))}
      </section>
    </>
  );
}

export function DetailListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-3 grid gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16" />
      ))}
    </div>
  );
}

function EntityCardSkeleton({ variant }: { variant: CardGridSkeletonProps['variant'] }) {
  const detailed = variant === 'detailed';
  const compact = variant === 'compact';

  return (
    <Card className="grid min-w-0 gap-4 overflow-hidden">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-3/5 max-w-36" />
            <Skeleton className="mt-2 h-4 w-4/5 max-w-48" />
          </div>
        </div>
        <Skeleton className="h-7 w-16 shrink-0 rounded-full sm:w-20" />
      </div>

      {compact ? null : (
        <>
          <div>
            <Skeleton className="h-4 w-2/5 max-w-24" />
            <Skeleton className="mt-2 h-8 w-3/5 max-w-36" />
          </div>
          <Skeleton className="h-10 w-full" />
        </>
      )}

      {detailed ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-4 w-2/3 max-w-40" />
        </>
      ) : null}

      <div className="flex gap-2">
        <Skeleton className="h-10 min-w-0 flex-1 sm:w-28 sm:flex-none" />
        <Skeleton className="h-10 min-w-0 flex-1 sm:w-32 sm:flex-none" />
      </div>
    </Card>
  );
}
