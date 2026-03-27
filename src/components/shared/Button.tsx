import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';
  
  const variants = {
    primary: 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700',
    secondary: 'bg-[var(--muted)] text-foreground hover:bg-[var(--muted)]/80',
    outline: 'bg-transparent border border-border text-foreground hover:bg-[var(--muted)]',
    ghost: 'bg-transparent text-foreground hover:bg-[var(--muted)]',
    danger: 'bg-rose-500 text-white shadow-lg shadow-rose-100 dark:shadow-rose-900/20 hover:bg-rose-600',
    success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20 hover:bg-emerald-600',
    warning: 'bg-amber-500 text-white shadow-lg shadow-amber-100 dark:shadow-amber-900/20 hover:bg-amber-600',
  };

  const sizes = {
    xs: 'px-2 py-1 text-[10px]',
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
    xl: 'px-10 py-5 text-lg',
    icon: 'p-2',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
