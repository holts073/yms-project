import React, { useState, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Package,
  FileText,
  Truck as TruckIcon,
  ArrowUpDown,
  Calendar,
  Shield
} from 'lucide-react';

const Dashboard = ({ onNavigate }: { onNavigate?: (tab: string, reference?: string, id?: string) => void }) => {
  const { state } = useSocket();
  const { deliveries = [] } = state || {};
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filterType, setFilterType] = useState<'action' | 'today'>('action');

  const getStatusLabel = (delivery: any) => {
    if (delivery.status === 100) return 'Afgeleverd';
    if (delivery.type === 'container') {
      if (delivery.status >= 75) return 'Onderweg naar Magazijn';
      if (delivery.status >= 50) return 'Douane';
      if (delivery.status >= 25) return 'In Transit';
      return 'Besteld';
    } else {
      if (delivery.status >= 50) return 'Onderweg naar Magazijn';
      if (delivery.status >= 25) return 'Transport aangevraagd';
      return 'Besteld';
    }
  };

  // Calculate stats
  const actionRequiredDeliveries = useMemo(() => deliveries.filter(d => 
    d.status < 100 && (
      d.documents.some(doc => doc.required && doc.status === 'missing') ||
      d.delayRisk === 'high'
    )
  ), [deliveries]);

  const expectedTodayDeliveries = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return deliveries.filter(d => 
      d.status < 100 && (d.etaWarehouse === today || d.eta === today)
    );
  }, [deliveries]);

  const activeDeliveries = deliveries.filter(d => d.status < 100);
  const enRouteToWarehouse = deliveries.filter(d => d.status >= 75 && d.status < 100);
  const inCustoms = deliveries.filter(d => d.type === 'container' && d.status >= 50 && d.status < 75);

  const displayedDeliveries = useMemo(() => {
    let list = filterType === 'action' ? actionRequiredDeliveries : expectedTodayDeliveries;
    
    if (sortConfig) {
      list = [...list].sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof typeof a];
        let bValue: any = b[sortConfig.key as keyof typeof b];

        // Handle nested or special fields
        if (sortConfig.key === 'supplier') {
          aValue = state?.addressBook?.suppliers.find(s => s.id === a.supplierId)?.name || '';
          bValue = state?.addressBook?.suppliers.find(s => s.id === b.supplierId)?.name || '';
        }
        if (sortConfig.key === 'eta') {
          aValue = a.etaWarehouse || a.eta || '';
          bValue = b.etaWarehouse || b.eta || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [filterType, actionRequiredDeliveries, expectedTodayDeliveries, sortConfig, state?.addressBook?.suppliers]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-10">
      <header className="flex items-center gap-6">
        <img 
          src="/logo.jfif" 
          alt="ILG Logo" 
          className="h-16 w-auto object-contain"
          referrerPolicy="no-referrer"
        />
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welkom bij ILG Foodgroup</h2>
          <p className="text-slate-500 mt-1">Overzicht van de huidige Supply Chain.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <button 
          onClick={() => setFilterType('action')}
          className={cn(
            "p-6 rounded-[2rem] border transition-all text-left group",
            filterType === 'action' ? "bg-amber-50 border-amber-200 shadow-md ring-2 ring-amber-500/20" : "bg-white border-slate-200 shadow-sm hover:border-amber-200"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-xl transition-colors", filterType === 'action' ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-600 group-hover:bg-amber-100")}>
              <AlertCircle size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Actie vereist</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{actionRequiredDeliveries.length}</p>
          <p className="text-slate-500 text-[11px] mt-1">Actie vereist</p>
        </button>

        <button 
          onClick={() => setFilterType('today')}
          className={cn(
            "p-6 rounded-[2rem] border transition-all text-left group",
            filterType === 'today' ? "bg-emerald-50 border-emerald-200 shadow-md ring-2 ring-emerald-500/20" : "bg-white border-slate-200 shadow-sm hover:border-emerald-200"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-xl transition-colors", filterType === 'today' ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100")}>
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Vandaag</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{expectedTodayDeliveries.length}</p>
          <p className="text-slate-500 text-[11px] mt-1">Verwacht</p>
        </button>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">In Transit</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{activeDeliveries.filter(d => d.status < 50).length}</p>
          <p className="text-slate-500 text-[11px] mt-1">In Transit</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Shield size={20} />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Douane</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{inCustoms.length}</p>
          <p className="text-slate-500 text-[11px] mt-1">Douane</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <TruckIcon size={20} />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Magazijn</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{enRouteToWarehouse.length}</p>
          <p className="text-slate-500 text-[11px] mt-1">Onderweg naar Magazijn</p>
        </div>
      </div>

      {/* Table Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", filterType === 'action' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
              {filterType === 'action' ? <AlertCircle size={20} /> : <Calendar size={20} />}
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {filterType === 'action' ? 'Actie Vereist' : 'Verwacht Vandaag'}
            </h3>
          </div>
        </div>
        
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
          {displayedDeliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th 
                      className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                      onClick={() => handleSort('reference')}
                    >
                      <div className="flex items-center gap-2">
                        Referentie <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Reden</th>
                    <th 
                      className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th 
                      className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                      onClick={() => handleSort('eta')}
                    >
                      <div className="flex items-center gap-2">
                        ETA <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedDeliveries.map((delivery) => {
                    const supplier = state?.addressBook?.suppliers.find(s => s.id === delivery.supplierId);
                    return (
                    <tr 
                      key={delivery.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => onNavigate?.('deliveries', undefined, delivery.id)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            delivery.type === 'container' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                          )}>
                            {delivery.type === 'container' ? <Package size={16} /> : <TruckIcon size={16} />}
                          </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">{delivery.reference}</p>
                              {supplier?.otif && (
                                <span className="text-[10px] font-bold text-emerald-600">
                                  OTIF: {supplier.otif}%
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{delivery.type} • {supplier?.name || 'Onbekend'}</p>
                              {delivery.containerNumber && (
                                <p className="text-[10px] text-slate-500 font-medium">Cont: <span className="text-slate-700">{delivery.containerNumber}</span></p>
                              )}
                              {delivery.type === 'container' && delivery.billOfLading && (
                                <p className="text-[10px] text-slate-500 font-medium">B/L: <span className="text-slate-700">{delivery.billOfLading}</span></p>
                              )}
                            </div>
                          </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          {delivery.documents.some(doc => doc.required && doc.status === 'missing') && (
                            <span className="text-xs font-medium text-amber-600 flex items-center gap-1.5">
                              <FileText size={12} />
                              Documenten ontbreken
                            </span>
                          )}
                          {delivery.delayRisk === 'high' && (
                            <span className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                              <AlertCircle size={12} />
                              Hoog risico op vertraging
                            </span>
                          )}
                          {filterType === 'today' && delivery.status < 100 && (
                            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                              <Calendar size={12} />
                              Verwacht vandaag
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {delivery.status}% • {getStatusLabel(delivery)}
                          </span>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full" style={{ width: `${delivery.status}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-medium text-slate-600">{delivery.etaWarehouse || delivery.eta || '-'}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center gap-1 ml-auto">
                          Bekijken <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", filterType === 'action' ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400")}>
                {filterType === 'action' ? <CheckCircle2 size={32} /> : <Calendar size={32} />}
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                {filterType === 'action' ? 'Alles bijgewerkt!' : 'Geen leveringen vandaag'}
              </h4>
              <p className="text-slate-500 text-sm">
                {filterType === 'action' ? 'Er zijn momenteel geen leveringen die actie vereisen.' : 'Er zijn geen leveringen gepland voor vandaag.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Dashboard;
