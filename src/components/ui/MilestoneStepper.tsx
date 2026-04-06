import React from 'react';
import { motion } from 'motion/react';
import { Check, AlertCircle, Ship, Truck, Store, ShieldCheck } from 'lucide-react';
import { Delivery } from '../../types';
import { CONTAINER_MILESTONES, EXWORKS_MILESTONES, isAnomaly } from '../../lib/logistics';
import { cn } from '../../lib/utils';

interface MilestoneStepperProps {
  delivery: Delivery;
  className?: string;
  onUpdateStatus?: (status: number) => void;
}

export const MilestoneStepper: React.FC<MilestoneStepperProps> = ({ delivery, className, onUpdateStatus }) => {
  const milestones = delivery.type === 'container' ? CONTAINER_MILESTONES : EXWORKS_MILESTONES;
  const currentStatus = delivery.status;
  const anomaly = isAnomaly(delivery);

  const getStepIcon = (key: string) => {
    switch (key) {
      case 'order': return <Store size={14} />;
      case 'in_transit': return <Truck size={14} />;
      case 'port_arrival': return <Ship size={14} />;
      case 'customs': return <ShieldCheck size={14} />;
      case 'warehouse': return <WarehouseIcon size={14} />;
      default: return null;
    }
  };

  return (
    <div className={cn("relative w-full py-4 min-w-[140px]", className)}>
      {/* Progress Line */}
      <div className="absolute top-[26px] left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStatus / 100) * 100}%` }}
          className={cn(
            "h-full transition-colors duration-500",
            anomaly ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          )}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {milestones.map((m, i) => {
          const isCompleted = currentStatus > m.status || (m.status === 100 && currentStatus >= 100);
          const isActive = currentStatus >= m.status;
          
          return (
            <div 
              key={m.key} 
              className={cn(
                "flex flex-col items-center gap-2 group",
                onUpdateStatus && "cursor-pointer"
              )}
              onClick={(e) => {
                if (onUpdateStatus) {
                  e.stopPropagation();
                  onUpdateStatus(m.status);
                }
              }}
            >
              <motion.div 
                initial={false}
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isCompleted ? 'var(--indigo-600)' : isActive ? (anomaly ? 'var(--rose-500)' : 'var(--indigo-600)') : 'var(--muted)',
                }}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-all",
                  isCompleted ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/40" : 
                  isActive ? (anomaly ? "bg-rose-500 border-rose-500 animate-pulse" : "bg-indigo-600 border-indigo-600 shadow-md") : 
                  "bg-card border-border"
                )}
              >
                {isCompleted ? (
                   <Check size={12} className="text-white" strokeWidth={4} />
                ) : (
                  <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-white" : "bg-slate-400 dark:bg-slate-600")} />
                )}
              </motion.div>
              
              <div className="flex flex-col items-center max-w-[100px] sm:max-w-none">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-tighter text-center transition-colors duration-300",
                  isActive ? "text-foreground" : "text-slate-400 dark:text-slate-600"
                )}>
                  {m.label}
                </span>
              </div>

            </div>
          );
        })}
      </div>
      
      {/* Anomaly Warning */}
      {anomaly && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-1.5 justify-center"
        >
          <AlertCircle size={12} className="text-rose-500" />
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Vertraagde levering - Check Status</span>
        </motion.div>
      )}
    </div>
  );
};

const WarehouseIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m6 0v1a3 3 0 0 0 6 0V7" /><path d="M9 7h6" /><path d="M21 21V9a2 2 0 0 0-2-2h-1a2 2 0 0 1-2-2V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2a2 2 0 0 1-2 2H5a2 2 0 0 0-2 2v12" />
  </svg>
);
