import * as React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'row' | 'text' | 'circle';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'text', count = 1 }) => {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-[var(--muted)]/50",
            variant === 'card' && "h-48 rounded-[2rem] border border-border",
            variant === 'row' && "h-16 rounded-2xl border border-border",
            variant === 'text' && "h-4 rounded-md w-full",
            variant === 'circle' && "h-12 w-12 rounded-full",
            className
          )}
        />
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-4">
    <Skeleton variant="row" count={rows} />
  </div>
);

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Skeleton variant="card" count={count} />
  </div>
);
