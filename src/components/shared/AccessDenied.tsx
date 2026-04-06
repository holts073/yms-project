import React from 'react';
import { Lock, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface AccessDeniedProps {
  title?: string;
  description?: string;
  feature?: string;
  onUpgrade?: () => void;
  compact?: boolean;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = "Toegang Vergrendeld",
  description = "Deze functie is onderdeel van een geavanceerde module en is momenteel niet geactiveerd in uw abonnement.",
  feature,
  onUpgrade = () => window.dispatchEvent(new CustomEvent('YMS_ACTION', { detail: { type: 'UPGRADE_REQUEST', payload: { feature } } })),
  compact = false
}) => {
  if (compact) {
    return (
      <div className="p-6 bg-rose-50/5 border border-rose-500/20 rounded-3xl flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
          <Lock size={20} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black uppercase tracking-tight text-foreground">{title}</h4>
          <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-tight">
            Activeer de {feature || 'module'} voor volledige toegang.
          </p>
        </div>
        <Button size="sm" onClick={onUpgrade} className="gap-2">
          Bekijk Bundels <Sparkles size={14} className="text-amber-400" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-rose-500 blur-3xl opacity-10 animate-pulse" />
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-2xl shadow-rose-500/20">
          <ShieldAlert size={48} strokeWidth={1.5} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-4 border-rose-500/10 flex items-center justify-center text-amber-500">
          <Lock size={18} />
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">
          {title}
        </h2>
        <p className="text-sm font-bold text-[var(--muted-foreground)] leading-relaxed">
          {description}
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-border/50 max-w-sm w-full space-y-4">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">
          <span>Module status</span>
          <span className="text-rose-500">Gedeactiveerd</span>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={onUpgrade} className="w-full py-6 rounded-2xl gap-3 text-sm group">
            Upgrade nu aanvragen
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-tight">
            Ontsluit 15+ geavanceerde logistieke features
          </p>
        </div>
      </div>
    </div>
  );
};
