import React from 'react';
import { motion } from 'motion/react';
import { Clock, MoreVertical, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { YmsDelivery, YmsDock } from '../../types';

interface YmsTimelineProps {
  docks: YmsDock[];
  deliveries: YmsDelivery[];
  onSaveDelivery: (d: Partial<YmsDelivery>) => void;
  getStatusLabel: (status: string) => string;
  isToday: boolean;
}

export const YmsTimeline: React.FC<YmsTimelineProps> = ({
  docks,
  deliveries,
  onSaveDelivery,
  getStatusLabel,
  isToday
}) => {
  const startHour = 7;
  const totalHours = 16;
  const hourWidth = 200;
  const timelineWidth = totalHours * hourWidth;

  return (
    <div className="flex-1 bg-card border border-border rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {/* Timeline Header */}
        <div className="flex sticky top-0 z-20 bg-[var(--muted)] border-b border-border">
          <div className="w-40 flex-shrink-0 border-r border-border p-4 font-bold text-xs text-[var(--muted-foreground)] uppercase tracking-widest bg-[var(--muted)]">Docks</div>
          {Array.from({ length: totalHours }).map((_, i) => (
            <div key={i} className="w-[200px] flex-shrink-0 p-4 border-r border-border text-sm font-bold text-foreground text-center">{i + startHour}:00</div>
          ))}
        </div>

        {/* Timeline Content */}
        <div className="relative">
          {docks.map(dock => (
            <div key={dock.id} className={cn("flex border-b border-border group", dock.status === 'Blocked' && 'bg-[var(--muted)]/50 grayscale')}>
              <div className="w-40 flex-shrink-0 border-r border-border p-4 bg-[var(--muted)]/50 group-hover:bg-[var(--muted)] transition-colors">
                <div className="font-bold text-foreground flex justify-between items-center">
                    {dock.name}
                    {dock.status === 'Blocked' && <AlertCircle size={12} className="text-rose-500" />}
                </div>
                <div className="flex gap-1 mt-1">
                  {dock.allowedTemperatures.map(temp => (
                    <div key={temp} className={cn(
                      "w-2 h-2 rounded-full",
                      temp === 'Vries' ? 'bg-blue-400' : temp === 'Koel' ? 'bg-indigo-400' : 'bg-amber-400'
                    )} title={temp} />
                  ))}
                </div>
              </div>
              
              <div className={cn("flex-1 flex relative h-24", `min-w-[${timelineWidth}px]`)} style={{ minWidth: timelineWidth }}>
                {Array.from({ length: totalHours }).map((_, i) => (
                  <div key={i} className="w-[200px] border-r border-border flex-shrink-0" />
                ))}
                
                {dock.status !== 'Blocked' && deliveries.filter(d => d.dockId === dock.id && d.status !== 'COMPLETED' && d.status !== 'GATE_OUT').map(delivery => {
                  const date = new Date(delivery.scheduledTime);
                  const hour = date.getHours();
                  const min = date.getMinutes();
                  const leftPos = (hour - startHour) * hourWidth + (min / 60) * hourWidth;
                  const width = (delivery.estimatedDuration || 90) / 60 * hourWidth;
                  
                  return (
                    <motion.div
                      layoutId={delivery.id}
                      key={delivery.id}
                      drag="x"
                      dragConstraints={{ left: 0, right: timelineWidth }}
                      dragMomentum={false}
                      onDragEnd={(_, info) => {
                         const timeDeltaMinutes = (info.offset.x / hourWidth) * 60;
                         if (Math.abs(timeDeltaMinutes) > 5) {
                           const newDate = new Date(delivery.scheduledTime);
                           newDate.setMinutes(newDate.getMinutes() + timeDeltaMinutes);
                           onSaveDelivery({ ...delivery, scheduledTime: newDate.toISOString() });
                         }
                      }}
                      className="absolute top-2 bottom-2 bg-card border border-border rounded-xl shadow-md p-2 cursor-grab active:cursor-grabbing z-10 hover:border-indigo-500 transition-colors group/card overflow-hidden"
                      style={{ left: leftPos, width }}
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
                        <MoreVertical size={12} className="text-slate-300 group-hover/card:text-slate-500" />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={cn(
                          "text-[8px] font-black px-1 rounded-sm",
                          delivery.direction === 'OUTBOUND' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {delivery.direction === 'OUTBOUND' ? 'OUT' : 'IN'}
                        </span>
                        <p className="font-bold text-[11px] truncate leading-tight">{delivery.reference}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono font-bold">{delivery.licensePlate || 'NR ONBEKEND'}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600">
                          <Clock size={10} />
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-[8px] text-slate-400 ml-1">({delivery.estimatedDuration || 90}m)</span>
                        </div>
                        {delivery.isLate && <AlertCircle size={10} className="text-rose-500 animate-pulse" />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
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
