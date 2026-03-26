import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  variant = 'default',
  padding = 'md',
  ...props 
}) => {
  const variants = {
    default: 'bg-card border-border/50 shadow-sm',
    muted: 'bg-[var(--muted)]/50 border-border/50',
    outline: 'bg-transparent border-border/50',
    glass: 'bg-card/40 backdrop-blur-md border-border/50 shadow-xl',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  return (
    <div 
      className={cn(
        'rounded-[2rem] border transition-all',
        variants[variant as keyof typeof variants],
        paddings[padding as keyof typeof paddings],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
