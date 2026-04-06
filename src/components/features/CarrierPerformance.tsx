import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../shared/Card';
import { Table } from '../shared/Table';
import { Badge } from '../shared/Badge';
import { Truck, Clock, Activity, TrendingDown, TrendingUp } from 'lucide-react';

interface PerformanceRecord {
  id: string;
  reference: string;
  supplier: string;
  supplierId: string;
  transporterId: string;
  arrivalDelay: number;
  unloadingDeviation: number;
  palletCount: number;
  timestamp: string;
}

interface CarrierStats {
  name: string;
  count: number;
  avgArrivalDelay: number;
  avgUnloadingDeviation: number;
  reliabilityScore: number;
}

export const CarrierPerformance: React.FC<{ warehouseId?: string }> = ({ warehouseId }) => {
  const [data, setData] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/yms/performance${warehouseId ? `?warehouseId=${warehouseId}` : ''}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [warehouseId]);

  const stats = useMemo(() => {
    const groups: Record<string, PerformanceRecord[]> = {};
    data.forEach(r => {
      const key = r.transporterId || r.supplierId || 'Onbekend';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    return Object.entries(groups).map(([id, records]) => {
      const avgArrivalDelay = Math.round(records.reduce((sum, r) => sum + r.arrivalDelay, 0) / records.length);
      const avgUnloadingDeviation = Math.round(records.reduce((sum, r) => sum + r.unloadingDeviation, 0) / records.length);
      
      // Reliability score calculation: 
      // 100 base points.
      // -1 point for every 5 minutes of arrival delay (capped at -40)
      // -1 point for every 5 minutes of unloading deviation (capped at -40)
      const arrivalPenalty = Math.min(40, Math.max(0, avgArrivalDelay / 5));
      const unloadingPenalty = Math.min(40, Math.max(0, avgUnloadingDeviation / 5));
      const reliabilityScore = Math.round(100 - arrivalPenalty - unloadingPenalty);

      return {
        id,
        name: records[0].supplier || id,
        count: records.length,
        avgArrivalDelay,
        avgUnloadingDeviation,
        reliabilityScore
      };
    }).sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }, [data]);

  const columns = [
    {
      header: 'Transporteur / Leverancier',
      accessor: (s: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
            <Truck size={16} />
          </div>
          <div>
            <p className="font-bold text-foreground">{s.name}</p>
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{s.id}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Ritten',
      accessor: (s: any) => <span className="font-bold">{s.count}</span>,
      className: 'text-center'
    },
    {
      header: 'Gem. Aankomst Vertraging',
      accessor: (s: any) => (
        <div className="flex items-center justify-center gap-2">
          <span className={cn("font-bold", s.avgArrivalDelay > 15 ? "text-rose-500" : "text-emerald-500")}>
            {s.avgArrivalDelay > 0 ? `+${s.avgArrivalDelay}m` : `${s.avgArrivalDelay}m`}
          </span>
          {s.avgArrivalDelay > 15 ? <TrendingUp size={12} className="text-rose-500" /> : <TrendingDown size={12} className="text-emerald-500" />}
        </div>
      ),
      className: 'text-center'
    },
    {
      header: 'Gem. Lostijd Afwijking',
      accessor: (s: any) => (
        <div className="flex items-center justify-center gap-2">
           <span className={cn("font-bold", s.avgUnloadingDeviation > 10 ? "text-amber-500" : "text-emerald-500")}>
            {s.avgUnloadingDeviation > 0 ? `+${s.avgUnloadingDeviation}m` : `${s.avgUnloadingDeviation}m`}
          </span>
        </div>
      ),
      className: 'text-center'
    },
    {
      header: 'Betrouwbaarheid',
      accessor: (s: any) => (
        <div className="flex items-center justify-end gap-3">
          <div className="w-24 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                s.reliabilityScore > 80 ? "bg-emerald-500" : (s.reliabilityScore > 60 ? "bg-amber-500" : "bg-rose-500")
              )}
              style={{ width: `${s.reliabilityScore}%` }}
            />
          </div>
          <span className="font-black text-sm w-8 text-right">{s.reliabilityScore}%</span>
        </div>
      ),
      className: 'text-right'
    }
  ];

  if (loading) return <div className="py-20 text-center animate-pulse text-[var(--muted-foreground)]">Prestaties berekenen...</div>;

  return (
    <Card padding="none" className="overflow-hidden border border-border shadow-sm">
      <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">
             <Activity size={20} />
           </div>
           <div>
             <h3 className="text-xl font-black text-foreground tracking-tight">Transporteur Betrouwbaarheid</h3>
             <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mt-0.5">Ranking op basis van operationele precisie</p>
           </div>
        </div>
        <Badge variant="info" className="font-bold">Last 30 Days</Badge>
      </div>
      <Table data={stats} columns={columns} />
    </Card>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
