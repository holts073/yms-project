import React, { ReactNode } from 'react';
import { getGlossaryTerm } from '../../lib/glossary';
import { Tooltip } from './Tooltip';
import { cn } from '../../lib/utils';
import { BookOpen } from 'lucide-react';

interface GlossaryTermProps {
  id: string;
  children?: ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const GlossaryTerm: React.FC<GlossaryTermProps> = ({ 
  id, 
  children, 
  className,
  position = 'top' 
}) => {
  const termData = getGlossaryTerm(id);

  if (!termData) {
    console.warn(`Glossary term not found for ID: ${id}`);
    return <span className={className}>{children || id}</span>;
  }

  const tooltipContent = (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase tracking-wider text-[10px] pb-1.5 border-b border-slate-700">
        <BookOpen size={12} />
        {termData.category}
      </div>
      <div className="font-bold text-slate-100 text-sm">{termData.term}</div>
      <div className="text-slate-300 leading-relaxed">
        {termData.definition}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position={position} className="min-w-[220px]">
      <span className={cn(
        "border-b-2 border-dotted border-indigo-400/50 hover:border-indigo-400 transition-colors dark:border-indigo-500/50 dark:hover:border-indigo-400",
        className
      )}>
        {children || termData.term}
      </span>
    </Tooltip>
  );
};
