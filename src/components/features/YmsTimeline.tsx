import React from 'react';
import { motion } from 'motion/react';
import { Clock, MoreVertical, AlertCircle, Snowflake, Thermometer, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useYmsData } from '../../hooks/useYmsData';
import { YmsDock, YmsDelivery, YmsDeliveryStatus, YmsWarehouse } from '../../types';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { isWithinOpeningHours } from '../../lib/ymsRules';

interface YmsTimelineProps {
  deliveries: YmsDelivery[];
  onSaveDelivery?: (delivery: YmsDelivery) => void;
  getStatusLabel?: (status: string) => string;
  isToday?: boolean;
  selectedDate: string;
}

export const YmsTimeline: React.FC<YmsTimelineProps> = ({
  deliveries,
  onSaveDelivery,
  getStatusLabel,
  isToday = false,
  selectedDate
}) => {
  const { docks } = useYmsData();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const startHour = 7;
  const totalHours = 16;
  const hourWidth = 200;
  const timelineWidth = totalHours * hourWidth;

  React.useEffect(() => {
    if (isToday && scrollContainerRef.current) {
      const now = new Date();
      const currentMinutes = (now.getHours() - startHour) * 60 + now.getMinutes();
      const scrollPos = (currentMinutes / (totalHours * 60)) * timelineWidth - 400; // Center it a bit
      scrollContainerRef.current.scrollLeft = Math.max(0, scrollPos);
    }
  }, [isToday, selectedDate]);

  return (
    <div className="flex-1 bg-card rounded-[2.5rem] border border-border overflow-hidden flex flex-col shadow-2xl relative">
      <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar relative bg-[var(--muted)]/5">
        {/* Timeline Header */}
        <div className="flex sticky top-0 z-20 bg-[var(--muted)] border-b border-border">
          <div className="w-40 flex-shrink-0 border-r border-border p-4 font-bold text-xs text-[var(--muted-foreground)] uppercase tracking-widest bg-[var(--muted)]">Docks</div>
          {Array.from({ length: totalHours }).map((_, i) => (
            <div key={i} className="w-[200px] flex-shrink-0 p-4 border-r border-border text-sm font-bold text-foreground text-center">{i + startHour}:00</div>
          ))}
        </div>

        {/* Timeline Content */}
        <div className="relative flex-1 overflow-auto" style={{ minHeight: `${Math.max(400, docks.length * 100)}px` }}>
          {docks.length === 0 && (
            <div className="py-20 text-center text-[var(--muted-foreground)] italic px-4">
              Geen actieve docks gevonden voor dit magazijn. Ga naar Instellingen om docks te activeren.
            </div>
          )}
          
          {docks.map(dock => (
            <YmsDockDroppableRow 
                key={dock.id} 
                dock={dock} 
                deliveries={deliveries} 
                selectedDate={selectedDate}
                startHour={startHour}
                totalHours={totalHours}
                hourWidth={hourWidth}
                timelineWidth={timelineWidth}
                getStatusLabel={getStatusLabel}
                onSaveDelivery={onSaveDelivery}
                warehouse={docks.find(d => d.warehouseId === dock.warehouseId) ? (useYmsData().warehouses.find(w => w.id === dock.warehouseId)) : undefined}
            />
          ))}
          
          {/* NOW Indicator */}
          {isToday && (
              <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                   style={{ left: 160 + (Math.max(0, Math.min(timelineWidth, (new Date().getHours() - startHour) * 60 + new Date().getMinutes())) / (totalHours * 60)) * timelineWidth }}>
                  <div className="bg-rose-500 text-white text-[8px] font-black px-1 rounded-sm absolute -top-4 -left-3">NU</div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

const YmsDockDroppableRow: React.FC<{ 
    dock: YmsDock, 
    deliveries: YmsDelivery[], 
    selectedDate: string,
    startHour: number,
    totalHours: number,
    hourWidth: number,
    timelineWidth: number,
    getStatusLabel: (s: string) => string,
    onSaveDelivery: (d: YmsDelivery) => void;
    warehouse?: YmsWarehouse;
}> = ({ 
    dock, 
    deliveries, 
    selectedDate, 
    startHour, 
    totalHours, 
    hourWidth, 
    timelineWidth,
    getStatusLabel,
    onSaveDelivery,
    warehouse
}) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `dock-${dock.id}`,
        data: {
          type: 'dock-row',
          dock
        }
    });

    return (
        <div 
            ref={setNodeRef}
            data-testid={`dock-row-${dock.id}`}
            className={cn(
                "flex border-b border-border group transition-colors", 
                dock.status === 'Blocked' && 'bg-[var(--muted)]/50 grayscale',
                isOver && "bg-indigo-500/5 ring-1 ring-inset ring-indigo-500/20"
            )}
        >
            <div className="w-40 flex-shrink-0 border-r border-border p-4 bg-[var(--muted)]/50 group-hover:bg-[var(--muted)] transition-colors">
                <div className="font-bold text-foreground flex justify-between items-center">
                    {dock.name}
                    {dock.status === 'Blocked' && <AlertCircle size={12} className="text-rose-500" />}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                    {dock.allowedTemperatures.map(temp => (
                        <div key={temp} className={cn(
                            "flex items-center gap-0.5 px-1 rounded text-[7px] font-bold uppercase border",
                            temp === 'Vries' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : 
                            temp === 'Koel' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' : 
                            'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                        )}>
                            {temp === 'Vries' ? <Snowflake size={8} /> : temp === 'Koel' ? <Thermometer size={8} /> : <Flame size={8} />}
                            {temp}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className={cn("flex-1 flex relative h-32", `min-w-[${timelineWidth}px]`)} style={{ minWidth: timelineWidth }}>
                {Array.from({ length: totalHours }).map((_, i) => (
                    <div key={i} className="w-[200px] border-r border-border flex-shrink-0" />
                ))}
                
                {dock.status !== 'Blocked' && deliveries.filter(d => String(d.dockId) === String(dock.id)).map(delivery => {
                    if (!delivery.scheduledTime) return null;
                    const date = new Date(delivery.scheduledTime);
                    if (isNaN(date.getTime())) return null;
                    
                    const dDate = date.toISOString().split('T')[0];
                    if (dDate !== selectedDate) return null;

                    const hour = date.getHours();
                    if (hour < startHour || hour >= startHour + totalHours) return null;

                    return (
                        <TimelineDraggableItem 
                            key={delivery.id} 
                            delivery={delivery} 
                            startHour={startHour} 
                            hourWidth={hourWidth}
                            getStatusLabel={getStatusLabel}
                            onSaveDelivery={onSaveDelivery}
                            warehouse={warehouse}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const TimelineDraggableItem: React.FC<{ 
    delivery: YmsDelivery, 
    startHour: number, 
    hourWidth: number,
    getStatusLabel: (s: string) => string,
    onSaveDelivery: (d: YmsDelivery) => void;
    warehouse?: YmsWarehouse;
}> = ({ 
    delivery, 
    startHour, 
    hourWidth,
    getStatusLabel,
    onSaveDelivery,
    warehouse
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: delivery.id,
        data: {
          type: 'timeline-item',
          delivery
        }
    });

    const isReefer = delivery.isReefer || delivery.temperature === 'Vries' || delivery.temperature === 'Koel';
    const date = new Date(delivery.scheduledTime);
    const hour = date.getHours();
    const min = date.getMinutes();
    const leftPos = (hour - startHour) * hourWidth + (min / 60) * hourWidth;
    const width = (delivery.estimatedDuration || 90) / 60 * hourWidth;

    const isOutsideHours = !isWithinOpeningHours(delivery.scheduledTime, warehouse?.openingTime, warehouse?.closingTime);

    const style = {
        left: leftPos,
        width,
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : 10,
        opacity: isDragging ? 0.6 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "absolute top-2 bottom-2 bg-card border border-border rounded-xl shadow-md p-2 cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-all group/card overflow-hidden",
                isDragging && "shadow-2xl border-indigo-500 scale-105 z-50",
                isReefer && "border-l-4 border-l-blue-500 shadow-[0_4px_10px_-4px_rgba(59,130,246,0.3)]",
                isOutsideHours && "border-2 border-dashed border-rose-500/50 bg-rose-50/10"
            )}
        >
            {/* Resize Handle */}
            <div 
                className="absolute right-0 top-0 bottom-0 w-2 hover:bg-indigo-500/10 cursor-ew-resize z-20 group-hover/card:bg-[var(--muted)] transition-colors"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startWidth = width;
                    
                    const onMouseUp = (upE: MouseEvent) => {
                        const deltaX = upE.clientX - startX;
                        const newWidth = Math.max(50, startWidth + deltaX);
                        const newDuration = Math.round((newWidth / hourWidth) * 60);
                        onSaveDelivery({ ...delivery, estimatedDuration: newDuration });
                        document.removeEventListener('mouseup', onMouseUp);
                    };
                    document.addEventListener('mouseup', onMouseUp);
                }}
            />
            <div className="flex justify-between items-start">
                <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase",
                    delivery.status === 'DOCKED' ? 'bg-indigo-100 text-indigo-700' : 
                    delivery.status === 'UNLOADING' || delivery.status === 'LOADING' ? 'bg-blue-100 text-blue-700' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                )}>
                    {getStatusLabel(delivery.status)}
                </span>
                <MoreVertical size={12} className="text-slate-300 group-hover/card:text-slate-500 dark:group-hover/card:text-slate-400" />
            </div>
            <span className="text-xs text-[var(--muted-foreground)] dark:text-slate-400 tabular-nums">
                {String(hour).padStart(2, '0')}:00
            </span>
            <div className="flex items-center gap-1 mt-0.5">
                <span className={cn(
                    "text-[8px] font-black px-1 rounded-sm",
                    delivery.direction === 'OUTBOUND' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                )}>
                    {delivery.direction === 'OUTBOUND' ? 'OUT' : 'IN'}
                </span>
                <p className="font-bold text-[11px] truncate leading-tight">{delivery.reference}</p>
            </div>
            <p className="text-[9px] text-slate-400 font-mono font-bold mt-0.5">{delivery.licensePlate || 'NR ONBEKEND'}</p>
            <div className="mt-auto flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600 dark:text-slate-400">
                    <Clock size={10} />
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-1">
                  {isOutsideHours && (
                    <div className="flex items-center gap-0.5 text-[8px] font-black text-rose-600 animate-pulse">
                        <AlertCircle size={10} />
                        OUTSIDE HOURS
                    </div>
                  )}
                  {isReefer && <Snowflake size={10} className="text-blue-500 animate-pulse" />}
                  {delivery.isLate && <AlertCircle size={10} className="text-rose-500 animate-pulse" />}
                </div>
            </div>
        </div>
    );
};
