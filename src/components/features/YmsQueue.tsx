import React, { useMemo, useEffect, useState } from 'react';
import { Truck, MapPin, Clock, AlertTriangle, Snowflake, LayoutGrid } from 'lucide-react';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { YmsDelivery, YmsDock, YmsWaitingArea } from '../../types';
import { cn } from '../../lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface YmsQueueProps {
  priorityQueue: YmsDelivery[];
  onAssignClick: (d: YmsDelivery) => void;
}

export const YmsQueue: React.FC<YmsQueueProps> = ({
  priorityQueue,
  onAssignClick
}) => {
  // Update wait times every minute
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const queueDeliveries = priorityQueue;

  return (
    <Card className="flex-1 overflow-hidden flex flex-col" padding="lg" data-testid="yms-queue">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <LayoutGrid size={24} />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Wachtrij Arrivé</h2>
        </div>
        <Badge variant="secondary" className="px-3 py-1 font-bold text-xs" data-testid="queue-count">
          {queueDeliveries.length} Voertuigen
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
        {queueDeliveries.map(delivery => (
          <QueueItem 
            key={delivery.id} 
            delivery={delivery} 
            onAssignClick={onAssignClick}
            now={now}
          />
        ))}
        {queueDeliveries.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 text-[var(--muted-foreground)] italic font-medium">
            <div className="p-4 bg-[var(--muted)]/50 rounded-full">
              <Truck size={40} className="opacity-20" />
            </div>
            Geen voertuigen in de wachtrij.
          </div>
        )}
      </div>
    </Card>
  );
};

interface QueueItemProps {
  delivery: YmsDelivery;
  onAssignClick: (d: YmsDelivery) => void;
  now: Date;
}

const QueueItem: React.FC<QueueItemProps> = ({ delivery, onAssignClick, now }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: delivery.id,
    data: {
      type: 'arrival',
      delivery
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const isReefer = delivery.isReefer || delivery.temperature === 'Vries' || delivery.temperature === 'Koel';
  
  // Wait time from metadata (backend)
  const waitMinutes = (delivery as any).metadata?.waitMinutes || 0;
  
  const waitStatus = useMemo(() => {
    if (waitMinutes > 60) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Dringend' };
    if (waitMinutes > 30) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Wachtend' };
    return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Nieuw' };
  }, [waitMinutes]);

  const startTime = new Date(delivery.registrationTime || delivery.arrivalTime || delivery.scheduledTime);

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-card border border-border rounded-2xl p-4 flex flex-col gap-4 group transition-all cursor-grab active:cursor-grabbing relative overflow-hidden",
        isDragging && "opacity-50 border-indigo-500 ring-4 ring-indigo-500/10",
        isReefer ? "border-l-4 border-l-blue-500 shadow-[0_0_15px_-5px_rgba(59,130,246,0.3)] dark:shadow-[0_0_20px_-5px_rgba(59,130,246,0.1)] hover:border-blue-400" : "hover:border-indigo-500/50 hover:shadow-lg"
      )}
    >
      {/* Wait Time Indicator Bar */}
      <div className={cn("absolute top-0 right-0 left-0 h-1 opacity-50", waitStatus.bg)} data-testid="wait-time-bar" />

      <div className="flex items-start justify-between" data-testid="yms-queue-item" data-id={delivery.id}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl border border-border transition-colors",
            isReefer ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" : "bg-card text-[var(--muted-foreground)]"
          )}>
            {isReefer ? <Snowflake size={20} /> : <Truck size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[8px] font-black px-1.5 py-0.5 rounded-md",
                delivery.direction === 'OUTBOUND' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              )}>
                {delivery.direction === 'OUTBOUND' ? 'OUTBOUND' : 'INBOUND'}
              </span>
              <p className="font-bold text-foreground text-sm tracking-tight" data-testid="delivery-reference">{delivery.reference}</p>
            </div>
            <p className="text-[10px] font-mono text-[var(--muted-foreground)] font-bold uppercase mt-0.5">{delivery.licensePlate || 'NR ONBEKEND'}</p>
          </div>
        </div>
        
        {isReefer && (
          <Badge className="bg-blue-500 text-white border-none text-[8px] px-1.5 h-4 flex items-center justify-center animate-pulse tracking-tighter" data-testid="priority-badge">
            PRIORITY
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className={waitStatus.color} />
            <span className={cn("text-xs font-bold", waitStatus.color)}>
              {waitMinutes > 0 ? `${waitMinutes}m` : 'Zojuist'}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)] font-medium">wachttijd</span>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] font-medium">
             Aankomst: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <Button 
          size="sm" 
          variant="secondary"
          leftIcon={<MapPin size={14} />} 
          className="text-xs h-8 px-4 rounded-xl" 
          onClick={(e) => {
            e.stopPropagation();
            onAssignClick(delivery);
          }}
        >
          Oproepen
        </Button>
      </div>
    </div>
  );
};
