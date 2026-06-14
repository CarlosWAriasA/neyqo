import { useEffect, useRef, type ReactNode } from 'react';
import { Skeleton } from './Skeleton';

interface InfiniteListBoundaryProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  children?: ReactNode;
  loadingMoreFallback?: ReactNode;
}

export function InfiniteListBoundary({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  children,
  loadingMoreFallback,
}: InfiniteListBoundaryProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNextPage) {
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) {
        onLoadMore();
      }
    }, { rootMargin: '240px' });

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      {isFetchingNextPage ? loadingMoreFallback ?? <Skeleton className="my-3 h-16" /> : null}
    </>
  );
}
