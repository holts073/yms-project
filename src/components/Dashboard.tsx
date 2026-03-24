import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useSocket } from '../SocketContext';
import { 
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Package,
  Check,
  FileText,
  Truck as TruckIcon,
  ArrowUpDown,
  Shield,
  Calendar,
  Plus,
  ArrowRight,
  MessageSquare,
  MapPin,
  Activity,
  Layers,
  Timer,
  ParkingSquare,
  AlertTriangle,
  ArrowDown
} from 'lucide-react';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

import { useDeliveries } from '../hooks/useDeliveries';

const Dashboard = ({ onNavigate }: { onNavigate?: (tab: string, reference?: string, id?: string) => void }) => {
  const { state, dispatch, currentUser } = useSocket();
  const { deliveries } = useDeliveries(1, 1000, '', 'all', 'eta', true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filterType, setFilterType] = useState<'action' | 'today' | 'enroute'>('action');

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const canMailTransport = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const setManualStatus = (delivery: any, newStatus: number) => {
    const updatedDelivery = {
      ...delivery,
      status: newStatus,
      statusHistory: [...(delivery.statusHistory || []), delivery.status],
      updatedAt: new Date().toISOString(),
      auditTrail: [
        ...(delivery.auditTrail || []),
        {
          timestamp: new Date().toISOString(),
          user: currentUser?.name || 'Unknown',
          action: 'Status Update',
          details: `Status via Dashboard gewijzigd naar ${newStatus}%`
        }
      ]
    };
    dispatch('UPDATE_DELIVERY', updatedDelivery);
  };

  const handleSendTransportEmail = (delivery: any) => {
    const supplier = state?.addressBook?.suppliers.find(s => s.id === delivery.supplierId);
    const transporter = state?.addressBook?.transporters.find(t => t.id === delivery.transporterId);
    
    if (!supplier || !transporter) {
      toast.error('Leverancier of transporteur niet gevonden.');
      return;
    }

    const subject = `Transport Order - Ref: ${delivery.reference}`;
    
    // Format the cost
    const costString = delivery.transportCost !== undefined 
      ? new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(delivery.transportCost)
      : 'N.v.t.';

    // Construct the beautiful 3-section email template
    const company = state?.companySettings || { name: 'ILG Foodgroup', address: '', phone: '', email: '' };
    const warehouse = state?.yms?.warehouses?.find(w => w.id === delivery.warehouseId);
    const destinationAddress = warehouse?.address || company.address || '-';
    const destinationName = warehouse?.name || company.name;
    
    const emailBody = `
Beste ${transporter.name},

Hierbij bevestigen wij de volgende transportopdracht:

--------------------------------------------------------------------------------
| [LOADING INFORMATION]                     | [DELIVERY INFORMATION]           |
--------------------------------------------------------------------------------
| Supplier: ${supplier.name.padEnd(31)} | Destination: ${destinationName.padEnd(19)} |
| Address: ${(supplier.address || '-').padEnd(32)} | Address: ${destinationAddress.padEnd(23)} |
| City: ${(delivery.loadingCity || '-').padEnd(35)} | ETA: ${(delivery.etaWarehouse || '-').padEnd(27)} |
| Country: ${(delivery.loadingCountry || '-').padEnd(32)} | Contact: ${(company.phone || '-').padEnd(25)} |
| Loading Time: ${(delivery.loadingTime || '-').padEnd(27)} |                                   |
--------------------------------------------------------------------------------

[CARGO DETAILS]
--------------------------------------------------------------------------------
Reference: ${delivery.reference}
Pallets: ${delivery.palletCount || 0} (${delivery.palletType || 'EUR'})
Weight: ${delivery.weight ? delivery.weight + ' kg' : '-'}
Cargo Type: ${delivery.cargoType || 'Dry'}
--------------------------------------------------------------------------------

[NOTES & COSTS]
--------------------------------------------------------------------------------
Transport Cost: ${costString}
Notes: ${delivery.notes || '-'}
Supplier Remarks: ${supplier.remarks || '-'}
--------------------------------------------------------------------------------

Met vriendelijke groet,

${company.name}
${company.address}
Tel: ${company.phone} | Email: ${company.email}
    `.trim();

    window.open(`mailto:${transporter.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`);
  };

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

  const getStatusSteps = (type: string) => {
    if (type === 'container') {
      return ['Besteld', 'In Transit', 'Douane', 'Onderweg naar Magazijn', 'Afgeleverd'];
    }
    return ['Besteld', 'Transport aangevraagd', 'Onderweg naar Magazijn', 'Afgeleverd'];
  };

  const getStatusIndex = (delivery: any) => {
    if (delivery.status === 100) return delivery.type === 'container' ? 4 : 3;
    if (delivery.type === 'container') {
      if (delivery.status >= 75) return 3;
      if (delivery.status >= 50) return 2;
      if (delivery.status >= 25) return 1;
      return 0;
    } else {
      if (delivery.status >= 50) return 2;
      if (delivery.status >= 25) return 1;
      return 0;
    }
  };

  // Calculate stats
  const actionRequiredDeliveries = useMemo(() => deliveries.filter(d => 
    d.status < 100 && (
      d.documents.some(doc => doc.required && doc.status === 'missing')
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
  const inTransit = deliveries.filter(d => d.status < 50);

  // YMS Stats
  const ymsDeliveries = state?.yms?.deliveries || [];
  const ymsDocks = state?.yms?.docks || [];
  const now = new Date();

  const arrivalsNoDock = ymsDeliveries.filter(d => d.status === 'GATE_IN' && !d.dockId);
  const plannedDockDelays = ymsDeliveries.filter(d => 
    d.status === 'PLANNED' && 
    d.dockId && 
    new Date(d.scheduledTime) < now
  );
  
  const totalDocks = ymsDocks.length;
  const occupiedDocks = ymsDocks.filter(d => d.status !== 'Available').length;
  const dockOccupancy = totalDocks > 0 ? Math.round((occupiedDocks / totalDocks) * 100) : 0;

  // Additional YMS KPIs
  const ymsWaitingAreas = state?.yms?.waitingAreas || [];
  const occupiedWaitingAreas = ymsWaitingAreas.filter(wa => wa.status !== 'Available').length;
  const yardOccupancy = ymsWaitingAreas.length > 0 ? Math.round((occupiedWaitingAreas / ymsWaitingAreas.length) * 100) : 0;

  const lateArrivals = ymsDeliveries.filter(d => d.isLate).length;

  const averageTurnaroundTime = useMemo(() => {
    const completedToday = ymsDeliveries.filter(d => 
      d.status === 'GATE_OUT' && 
      d.statusTimestamps?.GATE_IN && 
      d.statusTimestamps?.GATE_OUT &&
      d.statusTimestamps?.GATE_OUT.startsWith(new Date().toISOString().split('T')[0])
    );
    if (completedToday.length === 0) return 0;
    const totalMinutes = completedToday.reduce((acc, d) => {
      const start = new Date(d.statusTimestamps!.GATE_IN!).getTime();
      const end = new Date(d.statusTimestamps!.GATE_OUT!).getTime();
      return acc + (end - start) / 60000;
    }, 0);
    return Math.round(totalMinutes / completedToday.length);
  }, [ymsDeliveries]);

  const displayedDeliveries = useMemo(() => {
    let list = filterType === 'action' ? actionRequiredDeliveries : (filterType === 'enroute' ? enRouteToWarehouse : expectedTodayDeliveries);
    
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
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Welkom bij ILG Foodgroup</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overzicht van de huidige Supply Chain.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <button 
          onClick={() => setFilterType('action')}
          className={cn(
            "p-6 rounded-[2rem] border transition-all text-left group",
            filterType === 'action' ? "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800 shadow-md ring-2 ring-rose-500/20" : "bg-card border-border shadow-sm hover:border-rose-200 dark:hover:border-rose-700"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-xl transition-colors", filterType === 'action' ? "bg-rose-600 text-white" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30")}>
              <AlertCircle size={20} />
            </div>
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Actie vereist</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{actionRequiredDeliveries.length}</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">Actie vereist</p>
        </button>

        <button 
          onClick={() => setFilterType('enroute')}
          className={cn(
            "p-6 rounded-[2rem] border transition-all text-left group",
            filterType === 'enroute' ? "bg-teal-50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800 shadow-md ring-2 ring-teal-500/20" : "bg-card border-border shadow-sm hover:border-teal-200 dark:hover:border-teal-700"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-xl transition-colors", filterType === 'enroute' ? "bg-teal-600 text-white" : "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30")}>
              <TruckIcon size={20} />
            </div>
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Onderweg</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{enRouteToWarehouse.length}</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">Onderweg naar Magazijn</p>
        </button>

        <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">In Transit</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{inTransit.length}</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">Niet geladen / Onderweg</p>
        </div>
      </div>

      {/* YMS Operating Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => onNavigate?.('yms-arrivals')}
          className="bg-card p-6 rounded-[2rem] border border-border shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <MapPin size={20} />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">YMS Aankomst</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{arrivalsNoDock.length}</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">Aangemeld, Geen Dock Toegewezen</p>
        </button>

        <button 
          onClick={() => onNavigate?.('yms-planning')}
          className="bg-card p-6 rounded-[2rem] border border-border shadow-sm hover:border-rose-200 dark:hover:border-rose-800 transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Vertragingen</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{plannedDockDelays.length}</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">Gepland met Dock, Niet gearriveerd</p>
        </button>

        <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Activity size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Bezetting</span>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-foreground">{dockOccupancy}%</p>
            <p className="text-slate-400 text-sm font-bold mb-1">({occupiedDocks}/{totalDocks})</p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                dockOccupancy > 80 ? "bg-rose-500" : dockOccupancy > 50 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${dockOccupancy}%` }}
            />
          </div>
        </div>

        {/* Row 2 of YMS KPIs */}
        <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Timer size={20} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Site Stay</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{averageTurnaroundTime} min</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">Gemiddelde tijd op site vandaag</p>
        </div>

        <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
              <ParkingSquare size={20} />
            </div>
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Capaciteit</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{yardOccupancy}%</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">{occupiedWaitingAreas} van {ymsWaitingAreas.length} plekken bezet</p>
        </div>

        <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Vertraagd</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{lateArrivals}</p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">Voertuigen met aankomstvertraging</p>
        </div>
      </div>

      {/* Table Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", filterType === 'action' ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300" : "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300")}>
              {filterType === 'action' ? <AlertCircle size={20} /> : <Calendar size={20} />}
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {filterType === 'action' ? 'Actie Vereist' : (filterType === 'enroute' ? 'Onderweg naar Magazijn' : 'Verwacht Vandaag')}
            </h3>
          </div>
        </div>
        
        <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
          {displayedDeliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border">
                    <th 
                      className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      onClick={() => handleSort('reference')}
                    >
                      <div className="flex items-center gap-2">
                        Referentie <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Opmerking</th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reden</th>
                    <th 
                      className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th 
                      className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      onClick={() => handleSort('eta')}
                    >
                      <div className="flex items-center gap-2">
                        ETA <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedDeliveries.map((delivery) => {
                    const supplier = state?.addressBook?.suppliers.find(s => s.id === delivery.supplierId);
                    return (
                    <tr 
                      key={delivery.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => onNavigate?.('deliveries', undefined, delivery.id)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            delivery.type === 'container' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300" : "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300"
                          )}>
                            {delivery.type === 'container' ? <Package size={16} /> : <TruckIcon size={16} />}
                          </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-foreground">{delivery.reference}</p>
                              {supplier?.otif && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  OTIF: {supplier.otif}%
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">{delivery.type} • {supplier?.name || 'Onbekend'}</p>
                              {delivery.containerNumber && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Cont: <span className="text-slate-900 dark:text-slate-100">{delivery.containerNumber}</span></p>
                              )}
                              {delivery.type === 'container' && delivery.billOfLading && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">B/L: <span className="text-slate-900 dark:text-slate-100">{delivery.billOfLading}</span></p>
                              )}
                            </div>
                          </div>
                      </td>
                      <td className="px-8 py-6">
                        {delivery.notes ? (
                          <div className="relative group/notes text-slate-400 hover:text-indigo-600 transition-colors cursor-help">
                            <MessageSquare size={18} />
                            <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl opacity-0 group-hover/notes:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl">
                              {delivery.notes}
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          {delivery.documents.some(doc => doc.required && doc.status === 'missing') && (
                            <span className="text-xs font-medium text-amber-600 flex items-center gap-1.5">
                              <FileText size={12} />
                              Documenten ontbreken
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
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {getStatusLabel(delivery)}
                          </span>
                          <div className="flex gap-1">
                            {getStatusSteps(delivery.type).map((step, idx) => (
                              <div 
                                key={step}
                                className={cn(
                                  "h-1.5 flex-1 rounded-full",
                                  idx <= getStatusIndex(delivery) ? (delivery.status === 100 ? "bg-emerald-500" : "bg-indigo-600 dark:bg-indigo-500") : "bg-slate-100 dark:bg-slate-800"
                                )}
                                title={step}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {delivery.etaWarehouse ? formatDate(delivery.etaWarehouse) : (delivery.eta ? formatDate(delivery.eta) : '-')}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {delivery.type === 'exworks' && delivery.status < 25 && canEdit && (
                            <button 
                              onClick={() => setManualStatus(delivery, 25)}
                              className="px-3 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full hover:bg-amber-100 transition-all uppercase tracking-wider"
                            >
                              Aanvragen
                            </button>
                          )}
                          {delivery.type === 'exworks' && delivery.status >= 25 && delivery.status < 50 && canEdit && canMailTransport && (
                            <button 
                              onClick={() => handleSendTransportEmail(delivery)}
                              className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full hover:bg-indigo-100 transition-all uppercase tracking-wider flex items-center gap-1.5"
                            >
                              <FileText size={12} />
                              Transport Order
                            </button>
                          )}
                          {delivery.type === 'container' && delivery.status >= 50 && delivery.status < 75 && canEdit && (
                            <button 
                              onClick={() => setManualStatus(delivery, 75)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full hover:bg-blue-100 transition-all uppercase tracking-wider"
                            >
                              Onderweg
                            </button>
                          )}
                          {delivery.status >= 50 && delivery.status < 100 && canEdit && (
                            <button 
                              onClick={() => {
                                 // Register in YMS
                                 const existingYms = state?.yms?.deliveries.find(yd => yd.reference === delivery.reference);
                                 const ymsId = existingYms?.id || Math.random().toString(36).substr(2, 9);
                                 const registrationTime = new Date().toISOString();
                                 const scheduledTime = delivery.etaWarehouse || delivery.eta || registrationTime;
                                 
                                 dispatch('YMS_SAVE_DELIVERY', {
                                   id: ymsId,
                                   mainDeliveryId: delivery.id,
                                   warehouseId: 'W01',
                                   reference: delivery.reference,
                                   licensePlate: delivery.containerNumber || 'NR ONBEKEND',
                                   supplier: state?.addressBook?.suppliers.find(s => s.id === delivery.supplierId)?.name || 'Onbekend',
                                   temperature: delivery.cargoType || 'Droog',
                                   isReefer: delivery.type === 'container' ? 1 : 0,
                                   scheduledTime: scheduledTime,
                                   registrationTime: registrationTime,
                                   status: 'GATE_IN',
                                   transporterId: delivery.transporterId
                                 });
                                 
                                 dispatch('UPDATE_DELIVERY', { ...delivery, status: 80 });
                                 toast.success('Vracht is aangemeld bij YMS module.');
                              }}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full hover:bg-emerald-100 transition-all uppercase tracking-wider flex items-center gap-1.5"
                            >
                              <MapPin size={12} />
                              Aanmelden
                            </button>
                          )}
                          <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-bold flex items-center gap-1 ml-2">
                            Bekijken <ChevronRight size={16} />
                          </button>
                        </div>
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
              <h4 className="text-lg font-bold text-foreground">
                {filterType === 'action' ? 'Alles bijgewerkt!' : 'Geen leveringen vandaag'}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
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
