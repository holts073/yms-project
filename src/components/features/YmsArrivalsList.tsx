import React from 'react';
import { Truck, MapPin } from 'lucide-react';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { YmsDelivery, YmsDock, YmsWaitingArea } from '../../types';
import { cn } from '../../lib/utils';

interface YmsArrivalsListProps {
  deliveries: YmsDelivery[];
  docks: YmsDock[];
  waitingAreas: YmsWaitingArea[];
  onAssignClick: (d: YmsDelivery) => void;
}

export const YmsArrivalsList: React.FC<YmsArrivalsListProps> = ({
  deliveries,
  docks,
  waitingAreas,
  onAssignClick
}) => {
  const arrivingDeliveries = deliveries
    .filter(d => d.status === 'GATE_IN' && !d.dockId && !d.waitingAreaId)
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

  return (
    <Card className="flex-1 overflow-hidden flex flex-col" padding="lg">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Aangemelde Leveringen (Wacht op toewijzing)
        </h3>
        <Badge variant="outline">{arrivingDeliveries.length} Voertuigen</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
        {arrivingDeliveries.map(delivery => (
          <div key={delivery.id} className="bg-[var(--muted)]/50 border border-border rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-card rounded-xl text-amber-600 dark:text-amber-500 border border-border">
                <Truck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded-md",
                    delivery.direction === 'OUTBOUND' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}>
                    {delivery.direction === 'OUTBOUND' ? 'OUTBOUND' : 'INBOUND'}
                  </span>
                  <p className="font-bold text-foreground text-sm">{delivery.reference}</p>
                </div>
                <p className="text-[10px] font-mono text-[var(--muted-foreground)] font-bold uppercase">{delivery.licensePlate || 'NR ONBEKEND'}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 whitespace-nowrap">
                  ETA: {new Date(delivery.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="relative group/assign-small">
              <Button size="sm" leftIcon={<MapPin size={14} />} className="text-xs" onClick={() => onAssignClick(delivery)}>
                 Toewijzen
               </Button>
            </div>
          </div>
        ))}
        {arrivingDeliveries.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--muted-foreground)] italic font-medium">
            Geen voertuigen die wachten op toewijzing.
          </div>
        )}
      </div>
    </Card>
  );
};
