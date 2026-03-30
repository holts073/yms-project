import React from 'react';
import { Search, Plus, Calendar, MapPin, Settings2 } from 'lucide-react';
import { Button } from '../shared/Button';
import { YmsWarehouse } from '../../types';

interface YmsHeaderProps {
  title: string;
  subtitle: string;
  warehouses: YmsWarehouse[];
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNewDelivery: () => void;
  onWarehouseSettings?: (id: string) => void;
  onBack?: () => void;
}

export const YmsHeader: React.FC<YmsHeaderProps> = ({
  title,
  subtitle,
  warehouses,
  selectedWarehouseId,
  onSelectWarehouse,
  selectedDate,
  onSelectDate,
  searchTerm,
  onSearchChange,
  onNewDelivery,
  onWarehouseSettings,
  onBack
}) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            {onBack ? (
              <button onClick={onBack} className="hover:scale-110 transition-transform">
                <MapPin className="text-white" size={32} strokeWidth={2.5} />
              </button>
            ) : (
              <MapPin className="text-white" size={32} strokeWidth={2.5} />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
            <p className="text-sm font-medium text-[var(--muted-foreground)] mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="secondary" onClick={onBack}>Terug naar Dashboard</Button>
          )}
          <Button onClick={onNewDelivery} leftIcon={<Plus size={20} />}>Plan Levering</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card p-2 rounded-[2rem] border border-border shadow-sm">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Zoek op referentie of leverancier..."
            className="w-full pl-14 pr-6 py-4 bg-[var(--muted)] border-none rounded-[1.5rem] text-sm font-bold text-foreground focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={20} />
          <input
            type="date"
            className="w-full pl-14 pr-6 py-4 bg-[var(--muted)] border-none rounded-[1.5rem] text-sm font-bold text-foreground focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
          />
        </div>

        <div className="flex gap-2 p-1 bg-[var(--muted)] rounded-[1.5rem]">
          {warehouses.map((w) => (
            <button
              key={w.id}
              onClick={() => onSelectWarehouse(w.id)}
              data-testid={selectedWarehouseId === w.id ? "active-warehouse" : `warehouse-${w.id}`}
              className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedWarehouseId === w.id 
                  ? 'bg-card text-indigo-600 dark:text-indigo-400 shadow-sm border border-border' 
                  : 'text-[var(--muted-foreground)] hover:text-foreground'
              }`}
            >
              {w.name}
            </button>
          ))}
          {onWarehouseSettings && (
            <button 
              onClick={() => onWarehouseSettings(selectedWarehouseId)}
              data-testid="btn-warehouse-settings"
              className="p-2 text-[var(--muted-foreground)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Capaciteit Instellingen"
            >
              <Settings2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
