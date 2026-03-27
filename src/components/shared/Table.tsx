import React from 'react';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  rowClassName?: string;
  onRowClick?: (item: T) => void;
  borderless?: boolean;
}

export function Table<T extends { id: string | number }>({
  data,
  columns,
  isLoading,
  emptyMessage = "Geen gegevens gevonden.",
  emptyIcon,
  rowClassName,
  onRowClick,
  borderless = false
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-20",
        !borderless && "bg-card rounded-[2.5rem] border border-border shadow-sm"
      )}>
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-[var(--muted-foreground)] font-medium">Gegevens laden...</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "overflow-hidden",
      !borderless && "bg-card rounded-[2.5rem] border border-border shadow-sm"
    )}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--muted)]/50 border-b border-border">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={cn(
                    "px-6 py-3 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => (
              <tr 
                key={item.id} 
                className={cn(
                  "hover:bg-[var(--muted)]/40 transition-colors group",
                  onRowClick && "cursor-pointer",
                  rowClassName
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, idx) => (
                  <td 
                    key={idx} 
                    className={cn(
                      "px-6 py-3.5",
                      col.className
                    )}
                  >
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : (item[col.accessor] as unknown as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-8 py-20 text-center text-[var(--muted-foreground)]">
                  {emptyIcon && <div className="mb-4 opacity-20 flex justify-center">{emptyIcon}</div>}
                  <p className="text-lg font-medium">{emptyMessage}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
