import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'top', 
  className 
}) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-[1px] border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800 dark:border-t-slate-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-slate-800 dark:border-b-slate-800',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-[1px] border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-slate-800 dark:border-l-slate-800',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-[1px] border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-slate-800 dark:border-r-slate-800'
  };

  return (
    <div className="group relative inline-block cursor-help">
      {children}
      <div 
        className={cn(
          "absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none",
          positionClasses[position],
          className
        )}
      >
        <div className="bg-slate-800 text-slate-100 text-xs px-3 py-2 rounded-lg shadow-xl w-max max-w-[250px] font-medium leading-relaxed border border-slate-700">
          {content}
          <div className={cn("absolute w-0 h-0", arrowClasses[position])} />
        </div>
      </div>
    </div>
  );
};
