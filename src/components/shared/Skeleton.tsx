import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'rectangular' 
}) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-800/50",
        variant === 'circular' ? "rounded-full" : "rounded-lg",
        variant === 'text' ? "h-4 w-3/4" : "",
        className
      )}
    />
  );
};

export const DeliveryCardSkeleton = () => (
  <div className="p-4 bg-card rounded-2xl border border-border/50 space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton className="w-24 h-5" />
      <Skeleton className="w-8 h-8" variant="circular" />
    </div>
    <Skeleton variant="text" />
    <div className="flex gap-2">
      <Skeleton className="w-16 h-4" />
      <Skeleton className="w-16 h-4" />
    </div>
  </div>
);
