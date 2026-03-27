import React from 'react';
import { Truck, MapPin, Zap, AlertCircle } from 'lucide-react';
import { Card } from '../shared/Card';
import { cn } from '../../lib/utils';

interface YmsStatsProps {
  stats: {
    totalDeliveries: number;
    activeDocks: number;
    totalDocks: number;
    waitingVehicles: number;
    alertsCount: number;
  };
}

export const YmsStats: React.FC<YmsStatsProps> = ({ stats }) => {
  const items = [
    {
      label: 'Actieve Leveringen',
      value: stats.totalDeliveries,
      icon: <Truck size={24} />,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'Dock Bezetting',
      value: `${stats.activeDocks}/${stats.totalDocks}`,
      icon: <MapPin size={24} />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'In Wachtrij',
      value: stats.waitingVehicles,
      icon: <Zap size={24} />,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Actieve Alerts',
      value: stats.alertsCount,
      icon: <AlertCircle size={24} />,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, index) => (
        <Card key={index} className="flex items-center gap-6" padding="lg">
          <div className={cn('p-4 rounded-2xl shrink-0', item.bgColor, item.color)}>
            {item.icon}
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1">
              {item.label}
            </p>
            <p className="text-3xl font-black text-foreground">
              {item.value}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};
