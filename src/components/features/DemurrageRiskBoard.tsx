import React from 'react';
import { useSocket } from '../../SocketContext';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { AlertTriangle, Ship, Calendar, Euro, Clock } from 'lucide-react';
import { Delivery } from '../../types';
import { GlossaryTerm } from '../shared/GlossaryTerm';

export const DemurrageRiskBoard = () => {
  const { state } = useSocket();

  if (!state.settings?.featureFlags?.enableCostControl) {
    return null;
  }

  // Filter actieve containers (status < 100) en type === 'container'
  const activeContainers = state.deliveries.filter(d => 
    d.type === 'container' && d.status < 100 && d.etaPort
  );

  const demurrageWarningDays = state.settings?.alert_thresholds?.demurrageWarningDays || 3;

  const analyzed = activeContainers.map(d => {
    const etaPort = new Date(d.etaPort!);
    const freeTime = d.freeTimeDays || 0;
    
    // Verwijder tijd voor een puur dag-verschil
    const freeTimeEnd = new Date(etaPort);
    freeTimeEnd.setDate(freeTimeEnd.getDate() + freeTime);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const end = new Date(freeTimeEnd);
    end.setHours(0,0,0,0);

    const diffTime = end.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isExceeded = daysLeft < 0;
    const isWarning = daysLeft >= 0 && daysLeft <= demurrageWarningDays;
    
    const projectedCost = isExceeded ? Math.abs(daysLeft) * (d.demurrageDailyRate || 0) : 0;

    return {
      ...d,
      freeTimeEnd,
      daysLeft,
      isExceeded,
      isWarning,
      projectedCost
    };
  }).filter(d => d.isExceeded || d.isWarning || d.daysLeft <= (demurrageWarningDays * 2)) // Toon alleen relevante of binnenkort aflopende
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (analyzed.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-6 text-foreground font-black uppercase tracking-tight text-xl">
          <AlertTriangle className="text-emerald-500" /> Demurrage Risk Board
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-[var(--muted-foreground)]">
          <Ship size={32} className="mb-3 opacity-20" />
          <p className="text-sm font-bold">Geen actuele Demurrage risico's</p>
          <p className="text-xs">Alle getraceerde containers vallen binnen de free time.</p>
        </div>
      </Card>
    );
  }

  const totalRisk = analyzed.reduce((sum, d) => sum + d.projectedCost, 0);

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-foreground font-black uppercase tracking-tight text-xl">
          <AlertTriangle className={totalRisk > 0 ? "text-rose-500" : "text-amber-500"} /> Demurrage Risk Board
        </div>
        {totalRisk > 0 && (
          <div className="bg-rose-500/10 text-rose-600 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/20 flex items-center gap-2">
            Actueel Verlies: € {totalRisk.toLocaleString('nl-NL')}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-border/50 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
              <th className="pb-3 font-semibold">Container / Ref</th>
              <th className="pb-3 font-semibold">ETA Port</th>
              <th className="pb-3 font-semibold text-center"><GlossaryTerm id="free_time">Free Time</GlossaryTerm></th>
              <th className="pb-3 font-semibold">Deadline</th>
              <th className="pb-3 font-semibold text-center">Status</th>
              <th className="pb-3 font-semibold text-right">Projected Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {analyzed.map((d) => (
              <tr key={d.id} className="group hover:bg-[var(--muted)]/30 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                      <Ship size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {d.containerNumber || 'Geen Container Nr'}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                        {d.reference} • {d.shippingLine || 'Onbekende Rederij'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                    <Calendar size={14} />
                    {new Date(d.etaPort!).toLocaleDateString('nl-NL')}
                  </div>
                </td>
                <td className="py-4 text-center font-bold text-[var(--muted-foreground)]">
                  {d.freeTimeDays || 0} Dagen
                </td>
                <td className="py-4 font-medium text-foreground">
                  {d.freeTimeEnd.toLocaleDateString('nl-NL')}
                </td>
                <td className="py-4 text-center">
                  <Badge 
                    variant={d.isExceeded ? 'danger' : d.isWarning ? 'warning' : 'success'}
                    size="sm"
                  >
                    {d.isExceeded ? (
                      <span className="flex items-center gap-1"><AlertTriangle size={12}/> {Math.abs(d.daysLeft)} dg overtijd</span>
                    ) : d.daysLeft === 0 ? (
                      <span className="flex items-center gap-1"><Clock size={12}/> Loopt Vandaag Af</span>
                    ) : (
                      <span>Nog {d.daysLeft} dg vrij</span>
                    )}
                  </Badge>
                </td>
                <td className="py-4 text-right">
                  {d.isExceeded ? (
                    <span className="font-bold text-rose-600 flex items-center justify-end gap-1">
                      <Euro size={14} />
                      {(d.projectedCost).toLocaleString('nl-NL')}
                    </span>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
