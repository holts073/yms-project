import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'muted';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  ...props
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const variants = {
    primary: 'border-indigo-600/20 border-t-indigo-600',
    white: 'border-white/20 border-t-white',
    muted: 'border-[var(--muted)] border-t-[var(--muted-foreground)]',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export const FullPageLoader = () => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center gap-4">
    <LoadingSpinner size="lg" />
    <p className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-widest animate-pulse">
      Laden...
    </p>
  </div>
);
