import React, { useMemo } from 'react';
import { useYmsData } from '../../hooks/useYmsData';
import { cn } from '../../lib/utils';
import { PieChart, Layout, Clock, CheckCircle2 } from 'lucide-react';

export const YmsCapacityStats: React.FC = () => {
  const { docks, ymsSlots } = useYmsData();
  
  const stats = useMemo(() => {
    // Basic calculation for the visible timeline (7:00 - 23:00 = 16 hours = 32 slots per dock)
    const totalPossibleSlots = docks.length * 32;
    const occupiedSlots = ymsSlots.length;
    const occupancyPercentage = totalPossibleSlots > 0 ? Math.round((occupiedSlots / totalPossibleSlots) * 100) : 0;
    
    return {
      total: totalPossibleSlots,
      occupied: occupiedSlots,
      percentage: occupancyPercentage,
      available: totalPossibleSlots - occupiedSlots
    };
  }, [docks, ymsSlots]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card border border-border p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl dark:bg-indigo-900/30 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            <PieChart size={18} />
          </div>
          <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Bezetting</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black text-foreground">{stats.percentage}%</span>
          <div className="h-1.5 flex-1 bg-[var(--muted)] rounded-full mb-2 overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                stats.percentage > 90 ? "bg-rose-500" : stats.percentage > 70 ? "bg-amber-500" : "bg-emerald-500"
              )} 
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Layout size={18} />
          </div>
          <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Capaciteit</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-foreground">{stats.occupied}</span>
          <span className="text-sm font-bold text-[var(--muted-foreground)]">/ {stats.total} slots</span>
        </div>
      </div>

      <div className="bg-card border border-border p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={18} />
          </div>
          <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Beschikbaar</span>
        </div>
        <div className="text-3xl font-black text-foreground">{stats.available}</div>
      </div>

      <div className="bg-card border border-border p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl dark:bg-amber-900/30 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <Clock size={18} />
          </div>
          <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Gem. Duur</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-foreground">60</span>
          <span className="text-sm font-bold text-[var(--muted-foreground)]">minuten</span>
        </div>
      </div>
    </div>
  );
};
