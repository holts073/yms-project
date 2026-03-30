import React from 'react';
import { AlertCircle, Truck, Clock, MapPin, Activity, Timer, ParkingSquare, AlertTriangle } from 'lucide-react';
import { StatCard } from '../shared/StatCard';
import { cn } from '../../lib/utils';

interface DashboardKPIsProps {
  stats: {
    actionRequired: number;
    enRoute: number;
    customs: number;
    inTransit: number;
    arrivalsNoDock: number;
    plannedDockDelays: number;
    dockOccupancy: number;
    occupiedDocks: number;
    totalDocks: number;
    averageTurnaroundTime: number;
    yardOccupancy: number;
    lateArrivals: number;
    occupiedWaitingAreas: number;
    totalWaitingAreas: number;
  };
  filterType: 'action' | 'today' | 'enroute' | 'customs' | 'in_transit';
  onFilterChange: (type: 'action' | 'today' | 'enroute' | 'customs' | 'in_transit') => void;
  onNavigate: (tab: string) => void;
}

export const DashboardKPIs: React.FC<DashboardKPIsProps> = ({ stats, filterType, onFilterChange, onNavigate }) => {
  return (
    <div className="space-y-8">
      {/* Supply Chain Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Actie Vereist" 
          value={stats.actionRequired} 
          icon={<AlertCircle size={20} />} 
          variant="danger"
          active={filterType === 'action'}
          onClick={() => onFilterChange('action')}
          description="Documenten missen"
        />
        <StatCard 
          title="In Transit" 
          value={stats.inTransit} 
          icon={<Clock size={20} />} 
          variant="info"
          active={filterType === 'in_transit'}
          onClick={() => onFilterChange('in_transit')}
          description="Niet geladen / Onderweg"
        />
        <StatCard 
          title="Douane" 
          value={stats.customs} 
          icon={<Activity size={20} />} 
          variant="warning"
          active={filterType === 'customs'}
          onClick={() => onFilterChange('customs')}
          description="Inklaring lopende"
        />
        <StatCard 
          title="Onderweg" 
          value={stats.enRoute} 
          icon={<Truck size={20} />} 
          variant="success"
          active={filterType === 'enroute'}
          onClick={() => onFilterChange('enroute')}
          description="Naar magazijn"
        />
      </div>

      {/* YMS Operating Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard 
          title="YMS Aankomst" 
          value={stats.arrivalsNoDock} 
          icon={<MapPin size={18} />} 
          variant="primary"
          onClick={() => onNavigate('yms-arrivals')}
          compact
        />
        <StatCard 
          title="Vertragingen" 
          value={stats.plannedDockDelays} 
          icon={<Clock size={18} />} 
          variant="danger"
          onClick={() => onNavigate('yms-planning')}
          compact
        />
        <StatCard 
          title="Docks" 
          value={`${stats.dockOccupancy}%`} 
          icon={<Activity size={18} />} 
          variant="warning"
          description={`${stats.occupiedDocks}/${stats.totalDocks}`}
          compact
        />
        <StatCard 
          title="Site Stay" 
          value={`${stats.averageTurnaroundTime}m`} 
          icon={<Timer size={18} />} 
          variant="info"
          compact
        />
        <StatCard 
          title="Yard" 
          value={`${stats.yardOccupancy}%`} 
          icon={<ParkingSquare size={18} />} 
          variant="warning"
          description={`${stats.occupiedWaitingAreas}/${stats.totalWaitingAreas}`}
          compact
        />
        <StatCard 
          title="Laat" 
          value={stats.lateArrivals} 
          icon={<AlertTriangle size={18} />} 
          variant="danger"
          compact
        />
      </div>
    </div>
  );
};
