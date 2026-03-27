import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  as?: 'input' | 'textarea' | 'select';
  containerClassName?: string;
  noMargin?: boolean;
  rows?: number;
  helpText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  className,
  containerClassName,
  as = 'input',
  children, // for select options
  noMargin, // Destructure to avoid leaking to DOM
  helpText,
  ...props
}) => {
  const baseClasses = 'w-full px-6 py-4 bg-[var(--muted)]/50 border border-border/50 rounded-full focus:ring-2 focus:ring-indigo-500 text-foreground font-medium outline-none transition-all placeholder:text-[var(--muted-foreground)]/50';
  const textareaClasses = 'w-full px-6 py-4 bg-[var(--muted)]/50 border border-border/50 rounded-[2rem] focus:ring-2 focus:ring-indigo-500 text-foreground font-medium outline-none transition-all placeholder:text-[var(--muted-foreground)]/50 resize-none min-h-[120px]';
  const selectClasses = 'w-full px-6 py-4 bg-[var(--muted)]/50 border border-border/50 rounded-full focus:ring-2 focus:ring-indigo-500 text-foreground font-medium outline-none transition-all appearance-none';

  return (
    <div className={cn('space-y-2 relative', containerClassName)}>
      {label && (
        <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-4">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50">
            {leftIcon}
          </div>
        )}
        
        {as === 'input' && (
          <input 
            className={cn(baseClasses, leftIcon && 'pl-14', error && 'border-rose-500', className)} 
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)} 
          />
        )}
        
        {as === 'textarea' && (
          <textarea 
            className={cn(textareaClasses, leftIcon && 'pl-14', error && 'border-rose-500', className)} 
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} 
          />
        )}
        
        {as === 'select' && (
          <select 
            className={cn(selectClasses, leftIcon && 'pl-14', error && 'border-rose-500', className)} 
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {children}
          </select>
        )}
      </div>
      
      {error && (
        <p className="text-xs font-bold text-rose-500 ml-4 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}

      {helpText && !error && (
        <p className="text-xs font-bold text-amber-500 ml-4 animate-in fade-in slide-in-from-top-1">
          {helpText}
        </p>
      )}
    </div>
  );
};
