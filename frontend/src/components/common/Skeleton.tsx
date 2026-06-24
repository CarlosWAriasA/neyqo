import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('skeleton-shimmer rounded-panel', className)} />;
}
