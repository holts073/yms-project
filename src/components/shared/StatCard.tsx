import React from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  iconClassName?: string;
  secondaryLabel?: string;
  className?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  active?: boolean;
  onClick?: () => void;
  description?: string;
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon,
  iconClassName,
  secondaryLabel,
  className,
  variant = 'default',
  active = false,
  onClick,
  description,
  compact = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary': return 'border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20';
      case 'success': return 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20';
      case 'warning': return 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20';
      case 'danger': return 'border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20';
      case 'info': return 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20';
      default: return 'border-border bg-card';
    }
  };

  const getIconStyles = () => {
    if (iconClassName) return iconClassName;
    switch (variant) {
      case 'primary': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400';
      case 'success': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'warning': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400';
      case 'danger': return 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400';
      case 'info': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card 
      className={cn(
        "flex flex-col justify-between h-full group transition-all duration-300 border-2",
        getVariantStyles(),
        active && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900",
        onClick && "cursor-pointer hover:translate-y-[-4px] hover:shadow-xl",
        className
      )} 
      padding={compact ? "md" : "lg"}
      onClick={onClick}
    >
      <div className={cn("flex items-center justify-between", compact ? "mb-2" : "mb-6")}>
        <h3 className="text-[var(--muted-foreground)] font-bold text-xs uppercase tracking-widest leading-none">{title}</h3>
        <div className={cn(
          "p-2.5 rounded-2xl transition-all group-hover:scale-110 shadow-sm",
          getIconStyles()
        )}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn("font-black text-foreground tracking-tight", compact ? "text-2xl" : "text-4xl")}>
          {value}
        </span>
        {unit && <span className="text-[var(--muted-foreground)] font-bold text-sm">{unit}</span>}
      </div>
      {(secondaryLabel || description) && (
        <div className={cn("mt-4 pt-4 border-t border-border/50", compact ? "hidden" : "block")}>
          {description && <p className="text-xs font-semibold text-foreground/80 mb-1">{description}</p>}
          {secondaryLabel && (
            <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-tighter italic">
              {secondaryLabel}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
