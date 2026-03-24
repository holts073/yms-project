import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, ShieldAlert, Clock, AlertCircle, 
  CheckCircle2, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Filter, MoreVertical, LayoutGrid, List, Map,
  Moon, Sun, Truck, MapPin, Zap, TrendingUp, User as UserIcon, Warehouse as WarehouseIcon
} from 'lucide-react';
import { useSocket } from '../SocketContext';
import { cn } from '../lib/utils';
import { 
  YmsDelivery, YmsTemperature, YmsDeliveryStatus, YmsDock, 
  YmsWaitingArea, YmsDirection, User, YmsWarehouse 
} from '../types';
import { YMS_STATUS_FLOW, isValidTransition, isFastLaneEligible } from '../lib/ymsRules';
import { toast } from 'sonner';
import { useTheme } from '../ThemeContext';

function getStatusLabel(status: string) {
  switch (status) {
    case 'EXPECTED': return 'Verwacht';
    case 'PLANNED': return 'Gepland';
    case 'GATE_IN': return 'Bij Poort';
    case 'IN_YARD': return 'In Yard';
    case 'DOCKED': return 'Aangedockt';
    case 'UNLOADING': return 'Lossen';
    case 'LOADING': return 'Laden';
    case 'COMPLETED': return 'Gereed';
    case 'GATE_OUT': return 'Vertrokken';
    default: return status;
  }
}

export default function YmsDashboard({ view = 'planning', onNavigate }: { view?: 'arrivals' | 'planning', onNavigate?: (tab: string, reference?: string, id?: string) => void }) {
  const { state, dispatch, socket } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Partial<YmsDelivery> | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('W01');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [complianceStats, setComplianceStats] = useState<any[]>([]);
  const [showQuickAssign, setShowQuickAssign] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  React.useEffect(() => {
    socket?.on("YMS_COMPLIANCE_STATS_RESULT", (stats: any[]) => {
      setComplianceStats(stats);
      setShowCompliance(true);
    });
    return () => { socket?.off("YMS_COMPLIANCE_STATS_RESULT"); };
  }, [socket]);

  if (!state?.yms) return null;

  const { deliveries = [], docks = [], waitingAreas = [], warehouses = [], dockOverrides = [], alerts = [] } = state.yms;

  // Filter Data based on selection
  const currentWarehouses = warehouses.filter(w => w.id === selectedWarehouseId);
  const currentDocks = docks.filter(d => d.warehouseId === selectedWarehouseId).map(dock => {
    // Apply Overrides if any
    const override = dockOverrides.find(o => o.warehouseId === selectedWarehouseId && o.dockId === dock.id && o.date === selectedDate);
    if (override) {
        return { ...dock, status: override.status, allowedTemperatures: override.allowedTemperatures };
    }
    return dock;
  });
  const currentWaitingAreas = waitingAreas.filter(wa => wa.warehouseId === selectedWarehouseId);
  const currentDeliveries = deliveries.filter(d => 
    d.warehouseId === selectedWarehouseId && 
    (d.scheduledTime.startsWith(selectedDate) || d.status === 'GATE_IN' || d.status === 'IN_YARD' || d.status === 'DOCKED' || d.status === 'UNLOADING' || d.status === 'LOADING')
  );

  // Expected deliveries from main Supply Chain
  const expectedDeliveries = (state.deliveries || [])
    .filter(d => 
      d.status < 100 && 
      (d.etaWarehouse === selectedDate || d.eta === selectedDate) &&
      !deliveries.some(yd => yd.mainDeliveryId === d.id) &&
      (d.warehouseId === selectedWarehouseId || !d.warehouseId) // Match warehouse
    )
    .map(d => ({
      id: `expected-${d.id}`,
      reference: d.reference,
      supplier: state.addressBook?.suppliers.find(s => s.id === d.supplierId)?.name || 'Onbekend',
      status: 'EXPECTED' as any,
      scheduledTime: `${selectedDate}T00:00:00Z`, // Placeholder time
      direction: 'INBOUND',
      isReefer: d.type === 'container' ? 1 : 0,
      temperature: d.cargoType || 'Droog',
      palletCount: d.palletCount || 0,
      mainDeliveryId: d.id,
      warehouseId: selectedWarehouseId
    }));

  const allVisibleDeliveries = [...currentDeliveries, ...expectedDeliveries];

  const handleSaveDelivery = (d: Partial<YmsDelivery>) => {
    const supplier = state.addressBook.suppliers.find(s => s.id === d.supplierId);
    const delivery = {
      ...d,
      id: d.id || Math.random().toString(36).substr(2, 9),
      warehouseId: selectedWarehouseId,
      supplier: supplier?.name || d.supplier || 'Onbekend',
      status: d.status || 'Scheduled',
      direction: d.direction || 'INBOUND',
      palletCount: d.palletCount || 0,
      scheduledTime: d.scheduledTime || `${selectedDate}T${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}:00Z`
    };
    dispatch('YMS_SAVE_DELIVERY', delivery);
    setIsModalOpen(false);
    setEditingDelivery(null);
  };

  const handleRegisterExpected = (d: any) => {
    const delivery = {
      reference: d.reference,
      supplier: d.supplier,
      licensePlate: '', // To be filled by guard at gate
      status: 'GATE_IN' as YmsDeliveryStatus,
      scheduledTime: `${selectedDate}T${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}:00Z`,
      direction: 'INBOUND' as YmsDirection,
      isReefer: d.isReefer,
      temperature: d.temperature,
      palletCount: d.palletCount,
      mainDeliveryId: d.mainDeliveryId,
      warehouseId: selectedWarehouseId
    };
    dispatch('YMS_SAVE_DELIVERY', delivery);
    
    // Also update main delivery status to 80
    if (d.mainDeliveryId) {
        const mainDel = state.deliveries.find((md: any) => md.id === d.mainDeliveryId);
        if (mainDel) {
            dispatch('UPDATE_DELIVERY', { ...mainDel, status: 80, updatedAt: new Date().toISOString() });
        }
    }
  };

  const handleDeleteDelivery = (id: string) => {
    if (confirm('Are you sure you want to delete this delivery?')) {
      dispatch('YMS_DELETE_DELIVERY', id);
    }
  };

  const handleUpdateStatus = (d: YmsDelivery, status: YmsDeliveryStatus) => {
    if (!isValidTransition(d.status, status)) {
      if (!confirm(`Statusovergang van ${getStatusLabel(d.status)} naar ${getStatusLabel(status)} is ongebruikelijk. Doorgaan?`)) return;
    }

    const updates: Partial<YmsDelivery> = { ...d, status };
    
    if (status === 'COMPLETED') {
        // Sync logic is handled by the backend now, but we clear the dock here for local UI smoothness
      if (d.dockId) {
        const dock = currentDocks.find(dk => dk.id === d.dockId);
        if (dock) dispatch('YMS_UPDATE_DOCK', { ...dock, status: 'Available', currentDeliveryId: null });
        updates.dockId = undefined;
      }
    } else if (status === 'GATE_OUT') {
      if (d.waitingAreaId) {
        const wa = currentWaitingAreas.find(w => w.id === d.waitingAreaId);
        if (wa) dispatch('YMS_UPDATE_WAITING_AREA', { ...wa, status: 'Available', currentDeliveryId: null });
        updates.waitingAreaId = undefined;
      }
    }
    
    dispatch('YMS_SAVE_DELIVERY', { ...d, ...updates });
  };

  const handleAssignToDock = (d: YmsDelivery, dockId: number) => {
    const dock = currentDocks.find(dk => dk.id === dockId);
    if (!dock) return;

    if (d.dockId && d.dockId !== dockId) {
      const prevDock = currentDocks.find(dk => dk.id === d.dockId);
      if (prevDock) dispatch('YMS_UPDATE_DOCK', { ...prevDock, status: 'Available', currentDeliveryId: null });
    }
    if (d.waitingAreaId) {
      const wa = currentWaitingAreas.find(w => w.id === d.waitingAreaId);
      if (wa) dispatch('YMS_UPDATE_WAITING_AREA', { ...wa, status: 'Available', currentDeliveryId: null });
    }

    dispatch('YMS_UPDATE_DOCK', { ...dock, status: 'Occupied', currentDeliveryId: d.id });
    dispatch('YMS_SAVE_DELIVERY', { ...d, dockId, waitingAreaId: null, status: 'DOCKED' });
  };

  const handleAssignToWaitingArea = (d: YmsDelivery, waId: number) => {
    const wa = currentWaitingAreas.find(w => w.id === waId);
    if (!wa) return;

    if (d.waitingAreaId && d.waitingAreaId !== waId) {
      const prevWa = currentWaitingAreas.find(w => w.id === d.waitingAreaId);
      if (prevWa) dispatch('YMS_UPDATE_WAITING_AREA', { ...prevWa, status: 'Available', currentDeliveryId: null });
    }
    if (d.dockId) {
      const dock = currentDocks.find(dk => dk.id === d.dockId);
      if (dock) dispatch('YMS_UPDATE_DOCK', { ...dock, status: 'Available', currentDeliveryId: null });
    }

    dispatch('YMS_UPDATE_WAITING_AREA', { ...wa, status: 'Occupied', currentDeliveryId: d.id });
    dispatch('YMS_SAVE_DELIVERY', { ...d, waitingAreaId: waId, dockId: null, status: 'IN_YARD' });
  };

  const filteredDeliveries = allVisibleDeliveries.filter(d => {
    const matchesSearch = d.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.licensePlate && d.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeFilters.includes('REEFER') && !d.isReefer) return false;
    if (activeFilters.includes('LATE') && !d.isLate) return false;
    if (activeFilters.includes('FASTLANE') && !isFastLaneEligible(d)) return false;
    
    return true;
  }).sort((a,b) => {
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
  });

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const changeDate = (days: number) => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + days);
      setSelectedDate(d.toISOString().split('T')[0]);
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const reeferAlertCount = activeAlerts.length;


  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
                {view === 'arrivals' ? 'YMS Aankomst' : 'YMS Planning'}
            </h2>
            <div className="flex items-center gap-4 mt-1">
                <select 
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="bg-card text-foreground font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-lg border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <div className="flex items-center gap-2 bg-card px-2 py-1 rounded-lg relative">
                    <button onClick={() => changeDate(-1)} className="p-1 hover:bg-[var(--muted)] rounded transition-colors text-slate-400 hover:text-indigo-600"><ChevronLeft size={14}/></button>
                    <div className="relative group/datepicker">
                        <button 
                            onClick={() => (document.getElementById('yms-calendar-picker') as any)?.showPicker()}
                            className="flex items-center gap-2 text-xs font-bold text-foreground min-w-24 justify-center hover:text-indigo-600 transition-colors"
                        >
                            <CalendarIcon size={14} className="text-slate-400" />
                            <div className="flex -space-x-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-background bg-[var(--muted)] flex items-center justify-center">
                                        <Zap size={10} className="text-[var(--muted-foreground)]" />
                                    </div>
                                ))}
                            </div>
                            {new Date(selectedDate).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </button>
                        <input 
                            id="yms-calendar-picker"
                            type="date" 
                            className="absolute opacity-0 pointer-events-none inset-0"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <button onClick={() => changeDate(1)} className="p-1 hover:bg-background rounded transition-colors text-slate-400 hover:text-indigo-600"><ChevronRight size={14}/></button>
                </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Zoeken..."
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-48 text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {[
                { id: 'REEFER', label: 'Reefer', color: 'bg-rose-100 text-rose-700' },
                { id: 'LATE', label: 'Te Laat', color: 'bg-amber-100 text-amber-700' },
                { id: 'FASTLANE', label: 'Fast Lane', color: 'bg-emerald-100 text-emerald-700' }
            ].map(f => (
                <button
                    key={f.id}
                    onClick={() => setActiveFilters(prev => prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id])}
                    className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                        activeFilters.includes(f.id) ? f.color + " border-transparent scale-105 shadow-sm" : "bg-card text-[var(--muted-foreground)] border-border hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                    )}
                >
                    {f.label}
                </button>
            ))}
          </div>

          {reeferAlertCount > 0 && (
            <button 
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-2 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all shadow-sm"
            >
              <ShieldAlert size={20} className="animate-pulse" />
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                {reeferAlertCount}
              </span>
            </button>
          )}


          <button
            onClick={toggleTheme}
            className="p-2 bg-[var(--muted)] text-foreground rounded-xl hover:bg-[var(--muted)]/80 transition-all border border-transparent dark:border-slate-700"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={() => dispatch('GET_COMPLIANCE_STATS', {})}
            className="flex items-center gap-2 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-rose-900/20 transition-all transform hover:scale-105 active:scale-95 group text-sm"
          >
            <ShieldAlert size={18} />
            Compliance Rapport
          </button>

          <button
            onClick={() => window.location.href = `#/yms-public?warehouseId=${selectedWarehouseId}`} 
            className="flex items-center gap-2 px-6 py-2 bg-[var(--muted)] text-foreground rounded-xl font-semibold hover:bg-[var(--muted)]/80 transition-all border border-border"
          >
            <Zap size={20} /> Monitor
          </button>
          
          {view === 'planning' && (
            <button
                onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
                className="px-4 py-2 bg-[var(--muted)] text-foreground rounded-xl font-bold hover:bg-[var(--muted)]/80 transition-all border border-border"
            >
                {viewMode === 'list' ? 'Timeline' : 'Lijst'}
            </button>
          )}

          <button
            onClick={() => setShowQuickAssign(!showQuickAssign)}
            className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95",
                showQuickAssign ? "bg-indigo-600 text-white" : "bg-[var(--muted)] text-foreground border border-border"
            )}
          >
            <Truck size={20} /> Quick-Assign
          </button>

          <button
            onClick={() => { setEditingDelivery({ status: 'Scheduled', temperature: 'Droog', isReefer: false, tempAlertThreshold: 30 }); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-md active:scale-95"
          >
            <Plus size={20} /> Nieuw
          </button>
        </div>
      </div>

      {/* Alerts Overlay */}
      {showAlerts && activeAlerts.length > 0 && (
        <div className="absolute top-24 right-8 w-96 bg-card rounded-3xl shadow-2xl border border-border p-6 z-50 max-h-[70vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                    <ShieldAlert size={18} className="text-rose-500" />
                    Actieve Waarschuwingen
                </h3>
                <button onClick={() => setShowAlerts(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><Plus size={18} className="rotate-45" /></button>
            </div>
            <div className="space-y-3">
                {activeAlerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-2xl border ${alert.severity === 'high' ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800'}`}>
                        <div className="flex justify-between items-start gap-2">
                            <p className={`text-xs font-bold ${alert.severity === 'high' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>{alert.message}</p>
                            <button 
                                onClick={() => dispatch('YMS_RESOLVE_ALERT', alert.id)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <CheckCircle2 size={16} />
                            </button>
                        </div>
                        <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 mt-2">
                            {new Date(alert.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Registered but not assigned list */}
      {/* Registered but not assigned list */}
      {view === 'arrivals' && (
        <div className="bg-card rounded-[2rem] border border-border p-8 shadow-sm space-y-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Aangemelde Leveringen (Wacht op toewijzing)
            </h3>
            <span className="px-3 py-1 bg-[var(--muted)] text-foreground text-[10px] font-black rounded-full uppercase">
              {currentDeliveries.filter(d => d.status === 'GATE_IN' && !d.dockId && !d.waitingAreaId).length} Voertuigen
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {currentDeliveries
              .filter(d => d.status === 'GATE_IN' && !d.dockId && !d.waitingAreaId)
              .sort((a,b) => {
                  return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
              })
              .map(delivery => (
              <div key={delivery.id} className="bg-[var(--muted)] border border-border rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-800 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-card rounded-xl text-amber-600 dark:text-amber-500 shadow-sm border border-border">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{delivery.reference}</p>
                    <p className="text-[10px] font-mono text-[var(--muted-foreground)] font-bold uppercase">{delivery.licensePlate || 'NR ONBEKEND'}</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 whitespace-nowrap">
                        ETA: {new Date(delivery.scheduledTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                <div className="relative group/assign-small">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/40">
                    <MapPin size={14} /> Toewijzen
                  </button>
                  <div className="absolute right-0 bottom-full mb-2 w-72 bg-card border border-border rounded-3xl shadow-2xl opacity-0 invisible group-hover/assign-small:opacity-100 group-hover/assign-small:visible transition-all z-50 p-6">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest italic">Selecteer Bestemming</p>
                    <div className="grid grid-cols-4 gap-2">
                      {currentDocks
                        .sort((a,b) => parseInt(a.name.replace(/\D/g,'') || '0') - parseInt(b.name.replace(/\D/g,'') || '0'))
                        .map(dk => {
                          const isOccupied = dk.status !== 'Available';
                          const isTempMatch = dk.allowedTemperatures.includes(delivery.temperature);
                          
                          return (
                            <button 
                                key={dk.id} 
                                disabled={isOccupied}
                                onClick={() => handleAssignToDock(delivery, dk.id)} 
                                className={cn(
                                    "p-2 rounded-xl text-xs font-bold transition-all relative border",
                                    isOccupied ? "bg-[var(--muted)] text-slate-300 border-border cursor-not-allowed" : 
                                    isTempMatch ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white" : 
                                    "bg-[var(--muted)] text-slate-400 border-border hover:bg-indigo-600 hover:text-white"
                                )}
                            >
                                {dk.name.replace('Dock ', '')}
                                {isOccupied && <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900" />}
                                {!isOccupied && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-900" />}
                            </button>
                          );
                        })}
                    </div>
                    <div className="h-px bg-border my-4" />
                    <p className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest italic">Wachtplaatsen</p>
                    <div className="grid grid-cols-5 gap-2">
                      {currentWaitingAreas.filter(wa => wa.status === 'Available').map(wa => (
                        <button key={wa.id} onClick={() => handleAssignToWaitingArea(delivery, wa.id)} className="p-2 bg-[var(--muted)] hover:bg-orange-600 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-border">{wa.id}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden gap-6 relative">
        <div className={cn("flex-1 overflow-hidden flex flex-col", view === 'arrivals' && 'hidden')}>
        {viewMode === 'list' ? (
          <div className="xl:col-span-3 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
            <div className="flex gap-4 mb-2 overflow-x-auto pb-2 scrollbar-hide">
              {['EXPECTED', 'PLANNED', 'GATE_IN', 'IN_YARD', 'DOCKED', 'UNLOADING', 'LOADING'].map(s => (
                <div key={s} className={cn(
                  "px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                                  s === 'EXPECTED' ? "bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-800" :
                  s === 'PLANNED' ? "bg-[var(--muted)] text-[var(--muted-foreground)]" :
                  s === 'GATE_IN' ? "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400" :
                  s === 'IN_YARD' ? "bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400" :
                  s === 'DOCKED' ? "bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400" :
                  s === 'UNLOADING' || s === 'LOADING' ? "bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400" : "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400"
                )}>
                  {getStatusLabel(s as any)} ({allVisibleDeliveries.filter(d => d.status === s).length})
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              {filteredDeliveries.map(delivery => (
                <motion.div layout key={delivery.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-[2rem] p-6 hover:shadow-xl dark:hover:shadow-indigo-500/10 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${
                        delivery.status === 'EXPECTED' ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-400 dark:text-purple-500 border border-purple-100 dark:border-purple-800' :
                        delivery.status === 'PLANNED' ? 'bg-[var(--muted)] text-[var(--muted-foreground)]' :
                        delivery.status === 'GATE_IN' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400' :
                        delivery.status === 'IN_YARD' ? 'bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400' :
                        delivery.status === 'DOCKED' ? 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400' :
                        delivery.status === 'UNLOADING' || delivery.status === 'LOADING' ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        <Truck size={32} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-bold text-foreground">{delivery.reference}</h4>
                          <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            delivery.temperature === 'Vries' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            delivery.temperature === 'Koel' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          }`}>
                            {delivery.temperature}
                          </span>
                          {delivery.isReefer && (
                             <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-rose-100">
                               Reefer
                             </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-slate-500 text-sm">
                          <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 rounded-md">
                            {delivery.direction === 'OUTBOUND' ? 'OUTBOUND (Laden)' : 'INBOUND (Lossen)'}
                          </span>
                          <span className="flex items-center gap-1 bg-[var(--muted)] px-2 rounded-md font-bold text-foreground">
                            {delivery.palletCount || 0} Pallets
                          </span>
                          <span className="flex items-center gap-1"><UserIcon size={14}/> {delivery.supplier}</span>
                          <span className="flex items-center gap-1 font-mono bg-[var(--muted)] px-2 rounded-md font-bold">{delivery.licensePlate || 'NR ONBEKEND'}</span>
                          {isFastLaneEligible(delivery) && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-200">
                              <Zap size={10} /> Fast Lane Eligible
                            </span>
                          )}
                        </div>
                        {delivery.isLate && (
                          <div className="mt-2">
                             <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-rose-100 animate-pulse w-fit">
                               <AlertCircle size={10} /> Te laat aangemeld (&gt;24u)
                             </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Tijdschema</p>
                        <div className="flex flex-col items-end">
                          <p className="text-foreground font-bold">{new Date(delivery.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      <div className="h-10 w-px bg-border" />
                      <div className="flex gap-2">
                        {delivery.status === 'EXPECTED' && (
                           <button 
                             onClick={() => handleRegisterExpected(delivery)} 
                             className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-100 dark:shadow-purple-900/20"
                           >
                             <MapPin size={16} /> Aanmelden
                           </button>
                        )}
                        {(delivery.status === 'GATE_IN' || delivery.status === 'PLANNED' || delivery.status === 'EXPECTED') && (
                          <div className="relative group/assign">
                            <button className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-xl font-bold text-sm hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all flex items-center gap-2"><WarehouseIcon size={16} /> Yard/Dock</button>
                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-card border border-border rounded-2xl shadow-2xl opacity-0 invisible group-hover/assign:opacity-100 group-hover/assign:visible transition-all z-10 p-4">
                                <div className="grid grid-cols-4 gap-2">
                                  {currentDocks.filter(dk => {
                                    if (dk.status !== 'Available') return false;
                                    if (dk.isFastLane && !isFastLaneEligible(delivery)) return false;
                                    return dk.allowedTemperatures.includes(delivery.temperature) || (delivery.temperature === 'Droog' && dk.isFastLane);
                                  }).map(dk => (
                                    <button key={dk.id} onClick={() => handleAssignToDock(delivery, dk.id)} className={cn(
                                      "p-2 rounded-lg text-xs font-bold transition-all",
                                      dk.isFastLane ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-600 dark:hover:bg-amber-500 hover:text-white" : "bg-[var(--muted)] hover:bg-indigo-600 hover:text-white"
                                    )}>{dk.id} {dk.isFastLane && "⚡"}</button>
                                  ))}
                                </div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 my-3 uppercase tracking-tighter">Wachtplaatsen (Actief)</p>
                                <div className="grid grid-cols-5 gap-2">
                                  {currentWaitingAreas.filter(wa => wa.status === 'Available' && (wa.adminStatus === 'Active' || !wa.adminStatus)).map(wa => (
                                    <button key={wa.id} onClick={() => handleAssignToWaitingArea(delivery, wa.id)} className="p-2 bg-[var(--muted)] hover:bg-orange-600 hover:text-white rounded-lg text-xs font-bold transition-all">{wa.id}</button>
                                  ))}
                                </div>
                            </div>
                          </div>
                        )}
                        {delivery.status === 'IN_YARD' && (
                           <div className="relative group/yard-to-dock">
                              <button className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-100 animate-pulse">
                                <WarehouseIcon size={16} /> NU NAAR DOCK
                              </button>
                              <div className="absolute right-0 bottom-full mb-2 w-48 bg-card border border-border rounded-2xl shadow-2xl opacity-0 invisible group-hover/yard-to-dock:opacity-100 group-hover/yard-to-dock:visible transition-all z-10 p-4">
                                <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-tighter italic">Kies Vrij Dock</p>
                                <div className="grid grid-cols-4 gap-2">
                                  {currentDocks.filter(dk => dk.status === 'Available' && dk.allowedTemperatures.includes(delivery.temperature)).map(dk => (
                                    <button key={dk.id} onClick={() => handleAssignToDock(delivery, dk.id)} className="p-2 bg-[var(--muted)] hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all">{dk.id}</button>
                                  ))}
                                </div>
                              </div>
                           </div>
                        )}
                        {delivery.status === 'DOCKED' && (
                          <div className="flex gap-2">
                             <button onClick={() => handleUpdateStatus(delivery, 'UNLOADING')} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-2">Lossen</button>
                             <button onClick={() => handleUpdateStatus(delivery, 'LOADING')} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-2">Laden</button>
                          </div>
                        )}
                        {(delivery.status === 'UNLOADING' || delivery.status === 'LOADING') && (
                          <button onClick={() => handleUpdateStatus(delivery, 'COMPLETED')} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center gap-2"><CheckCircle2 size={16} /> Gereed</button>
                        )}
                        {delivery.status === 'COMPLETED' && (
                          <button onClick={() => handleUpdateStatus(delivery, 'GATE_OUT')} className="px-4 py-2 bg-[var(--muted)] text-foreground rounded-xl font-bold text-sm hover:bg-[var(--muted)]/80 transition-all flex items-center gap-2">Vertrokken</button>
                        )}
                        <button onClick={() => { setEditingDelivery(delivery); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-slate-600"><MoreVertical size={20} /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredDeliveries.length === 0 && (
                  <div className="py-20 text-center text-slate-400 font-medium">Geen leveringen op deze dag.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-card border border-border rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
            <div className="flex-1 overflow-auto custom-scrollbar relative">
              <div className="flex sticky top-0 z-20 bg-[var(--muted)] border-b border-border">
                <div className="w-40 flex-shrink-0 border-r border-border p-4 font-bold text-xs text-[var(--muted-foreground)] uppercase tracking-widest bg-[var(--muted)]">Docks</div>
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="w-[200px] flex-shrink-0 p-4 border-r border-border text-sm font-bold text-foreground text-center">{i + 7}:00</div>
                ))}
              </div>

              <div className="relative">
                {currentDocks.map(dock => (
                  <div key={dock.id} className={`flex border-b border-border group ${dock.status === 'Blocked' ? 'bg-[var(--muted)]/50 grayscale' : ''}`}>
                    <div className="w-40 flex-shrink-0 border-r border-border p-4 bg-[var(--muted)]/50 group-hover:bg-[var(--muted)] transition-colors">
                      <div className="font-bold text-foreground flex justify-between items-center">
                          {dock.name}
                          {dock.status === 'Blocked' && <AlertCircle size={12} className="text-rose-500" />}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {dock.allowedTemperatures.map(temp => (
                          <div key={temp} className={`w-2 h-2 rounded-full ${temp === 'Vries' ? 'bg-blue-400' : temp === 'Koel' ? 'bg-indigo-400' : 'bg-amber-400'}`} title={temp} />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex relative h-24 min-w-[3200px]">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="w-[200px] border-r border-border flex-shrink-0" />
                      ))}
                      
                      {dock.status !== 'Blocked' && currentDeliveries.filter(d => d.dockId === dock.id && d.status !== 'Completed').map(delivery => {
                        const date = new Date(delivery.scheduledTime);
                        const startHour = 7;
                        const hour = date.getHours();
                        const min = date.getMinutes();
                        const leftPos = (hour - startHour) * 200 + (min / 60) * 200;
                        
                        return (
                          <motion.div
                            layoutId={delivery.id}
                            key={delivery.id}
                            drag={viewMode === 'timeline' ? "x" : false}
                            dragConstraints={{ left: 0, right: 3200 }}
                            dragMomentum={false}
                            onDragEnd={(_, info) => {
                               const hourWidth = 200;
                               const timeDeltaMinutes = (info.offset.x / hourWidth) * 60;
                               if (Math.abs(timeDeltaMinutes) > 5) {
                                 const newDate = new Date(delivery.scheduledTime);
                                 newDate.setMinutes(newDate.getMinutes() + timeDeltaMinutes);
                                 handleSaveDelivery({ ...delivery, scheduledTime: newDate.toISOString() });
                               }
                            }}
                             className="absolute top-2 h-20 bg-card border border-border rounded-2xl shadow-lg p-3 cursor-grab active:cursor-grabbing z-10 hover:border-indigo-500 transition-colors group/card overflow-hidden"
                            style={{ 
                                left: leftPos,
                                width: (delivery.estimatedDuration || 90) / 60 * 200
                            }}
                          >
                            <div 
                                className="absolute right-0 top-0 bottom-0 w-2 hover:bg-indigo-500/10 cursor-ew-resize z-20 group-hover/card:bg-[var(--muted)] transition-colors"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    const startX = e.clientX;
                                    const startWidth = (delivery.estimatedDuration || 90) / 60 * 200;
                                    
                                    const onMouseMove = (moveE: MouseEvent) => {
                                        const deltaX = moveE.clientX - startX;
                                        const newWidth = Math.max(50, startWidth + deltaX);
                                        const newDuration = (newWidth / 200) * 60;
                                        // Update locally for feedback would be nice, but here we just update on mouseup
                                    };
                                    
                                    const onMouseUp = (upE: MouseEvent) => {
                                        const deltaX = upE.clientX - startX;
                                        const newWidth = Math.max(50, startWidth + deltaX);
                                        const newDuration = Math.round((newWidth / 200) * 60);
                                        handleSaveDelivery({ ...delivery, estimatedDuration: newDuration });
                                        document.removeEventListener('mousemove', onMouseMove);
                                        document.removeEventListener('mouseup', onMouseUp);
                                    };
                                    
                                    document.addEventListener('mousemove', onMouseMove);
                                    document.addEventListener('mouseup', onMouseUp);
                                }}
                            />
                            <div className="flex justify-between items-start">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                                delivery.status === 'DOCKED' ? 'bg-indigo-100 text-indigo-700' : 
                                delivery.status === 'UNLOADING' || delivery.status === 'LOADING' ? 'bg-blue-100 text-blue-700' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                              }`}>
                                {getStatusLabel(delivery.status)}
                              </span>
                              <MoreVertical size={12} className="text-slate-300 group-hover/card:text-slate-500" />
                            </div>
                            <p className="font-bold text-xs mt-1 truncate">{delivery.reference}</p>
                            <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{delivery.licensePlate || 'NR ONBEKEND'}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                                <Clock size={10} />
                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <span className="text-[8px] text-slate-300 ml-1">({delivery.estimatedDuration || 90}m)</span>
                              </div>
                              {delivery.isLate && <AlertCircle size={10} className="text-rose-500 animate-pulse" />}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {isToday && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                         style={{ left: 160 + (Math.max(0, Math.min(16 * 60, (new Date().getHours() - 7) * 60 + new Date().getMinutes())) / (16 * 60)) * 3200 }}>
                        <div className="bg-rose-500 text-white text-[8px] font-black px-1 rounded-sm absolute -top-4 -left-3">NU</div>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Quick-Assign Sidebar */}
        <div 
            className={cn(
                "w-80 bg-card border border-border rounded-[2.5rem] flex flex-col overflow-hidden transition-all duration-500 shadow-xl",
                showQuickAssign ? "translate-x-0 opacity-100" : "w-0 translate-x-12 opacity-0 pointer-events-none"
            )}
        >
            <div className="p-6 border-b border-border bg-[var(--muted)] flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-foreground">Quick-Assign</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Wacht op Dock</p>
                </div>
                <button onClick={() => setShowQuickAssign(false)} className="p-2 hover:bg-background rounded-full transition-colors text-slate-400"><Plus size={18} className="rotate-45" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {currentDeliveries
                    .filter(d => d.status === 'GATE_IN' && !d.dockId)
                    .map(delivery => (
                <motion.div
                    key={delivery.id}
                    drag
                    dragSnapToOrigin
                    onDragStart={() => toast.info(`Sleep ${delivery.reference} naar een dock...`, { id: 'drag-hint', duration: 1000 })}
                    onDragEnd={(_, info) => {
                        // Check if dropped near a dock card (this is a simple heuristic or I can use drop targets)
                        // For now, let's keep it visually premium and implement actual drop detection if possible.
                        // Since I don't have easy access to dock positions in this component without refs, 
                        // I'll at least make the cards "feel" draggable.
                    }}
                    whileDrag={{ scale: 1.05, rotate: 2, zIndex: 50 }}
                    className="p-4 bg-card border border-border rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-colors"
                >
                            <div className="flex items-center justify-between mb-3">
                                <span className={cn(
                                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                                    delivery.temperature === 'Vries' ? 'bg-blue-100 text-blue-700' :
                                    delivery.temperature === 'Koel' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                                )}>{delivery.temperature}</span>
                                <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter uppercase">{delivery.licensePlate || 'NR ONBEKEND'}</span>
                            </div>
                            <h4 className="font-bold text-foreground text-sm mb-1">{delivery.reference}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-4">{delivery.supplier}</p>
                            
                            <div className="grid grid-cols-4 gap-1.5">
                                {currentDocks
                                    .filter(dk => dk.status === 'Available' && dk.allowedTemperatures.includes(delivery.temperature))
                                    .slice(0, 8)
                                    .map(dk => (
                                        <button 
                                            key={dk.id} 
                                            onClick={() => handleAssignToDock(delivery, dk.id)}
                                            className="h-8 rounded-lg bg-card border border-border flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                        >
                                            {dk.name.replace('Dock ', '')}
                                        </button>
                                    ))
                                }
                                {currentDocks.filter(dk => dk.status === 'Available' && dk.allowedTemperatures.includes(delivery.temperature)).length === 0 && (
                                    <div className="col-span-4 py-2 text-center text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 rounded-xl">Geen Docks Vrij</div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                {currentDeliveries.filter(d => d.status === 'GATE_IN' && !d.dockId).length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-12 h-12 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-inner">
                            <CheckCircle2 size={24} className="text-emerald-400" />
                        </div>
                        <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Alles Toegewezen</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 overflow-hidden relative border border-border">
            <h3 className="text-2xl font-bold mb-8 text-foreground">{editingDelivery?.id ? 'Bewerken' : 'Nieuwe Levering'}</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Referentie</label>
                  <input type="text" className="w-full px-4 py-3 bg-[var(--muted)] dark:bg-slate-800 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground" value={editingDelivery?.reference || ''} onChange={(e) => setEditingDelivery({...editingDelivery, reference: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Kenteken</label>
                  <input type="text" className="w-full px-4 py-3 bg-[var(--muted)] dark:bg-slate-800 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold uppercase tracking-wider text-foreground" value={editingDelivery?.licensePlate || ''} onChange={(e) => setEditingDelivery({...editingDelivery, licensePlate: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Leverancier</label>
                  <select className="w-full px-4 py-3 bg-[var(--muted)] dark:bg-slate-800 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground" value={editingDelivery?.supplierId || ''} onChange={(e) => setEditingDelivery({...editingDelivery, supplierId: e.target.value})}>
                    <option value="">Selecteer</option>
                    {state.addressBook.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Transporteur</label>
                  <select className="w-full px-4 py-3 bg-[var(--muted)] dark:bg-slate-800 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground" value={editingDelivery?.transporterId || ''} onChange={(e) => setEditingDelivery({...editingDelivery, transporterId: e.target.value})}>
                    <option value="">Selecteer</option>
                    {state.addressBook.transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Tijd (HH:mm)</label>
                  <input type="time" className="w-full px-4 py-3 bg-[var(--muted)] dark:bg-slate-800 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground" value={editingDelivery?.scheduledTime ? new Date(editingDelivery.scheduledTime).toTimeString().substr(0, 5) : ''} onChange={(e) => {
                      const [h, m] = e.target.value.split(':');
                      const d = new Date(editingDelivery?.scheduledTime || `${selectedDate}T00:00:00Z`);
                      d.setHours(parseInt(h), parseInt(m), 0, 0);
                      setEditingDelivery({...editingDelivery, scheduledTime: d.toISOString()});
                  }} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Temperatuur</label>
                  <select className="w-full px-4 py-3 bg-[var(--muted)] dark:bg-slate-800 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground" value={editingDelivery?.temperature || 'Droog'} onChange={(e) => setEditingDelivery({...editingDelivery, temperature: e.target.value as YmsTemperature})}>
                    <option value="Droog">Droog</option>
                    <option value="Koel">Koel</option>
                    <option value="Vries">Vries</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Richting</label>
                  <select className="w-full px-4 py-3 bg-[var(--muted)] dark:bg-slate-800 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground" value={editingDelivery?.direction || 'INBOUND'} onChange={(e) => setEditingDelivery({...editingDelivery, direction: e.target.value as 'INBOUND' | 'OUTBOUND'})}>
                    <option value="INBOUND">Inbound (Lossen)</option>
                    <option value="OUTBOUND">Outbound (Laden)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Pallets</label>
                  <input type="number" className="w-full px-4 py-3 bg-[var(--muted)] dark:bg-slate-800 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground" value={editingDelivery?.palletCount || 0} onChange={(e) => setEditingDelivery({...editingDelivery, palletCount: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Aangedockt bij</label>
                  <select className="w-full px-4 py-3 bg-[var(--muted)] dark:bg-slate-800 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground" value={editingDelivery?.dockId || ''} onChange={(e) => setEditingDelivery({...editingDelivery, dockId: e.target.value ? parseInt(e.target.value) : undefined})}>
                    <option value="">Geen</option>
                    {state.yms.docks.map(dk => <option key={dk.id} value={dk.id}>{dk.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Wachtplaats</label>
                  <select className="w-full px-4 py-3 bg-[var(--muted)] dark:bg-slate-800 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground" value={editingDelivery?.waitingAreaId || ''} onChange={(e) => setEditingDelivery({...editingDelivery, waitingAreaId: e.target.value ? parseInt(e.target.value) : undefined})}>
                    <option value="">Geen</option>
                    {state.yms.waitingAreas.map(wa => <option key={wa.id} value={wa.id}>Wachtplaats {wa.id}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-[var(--muted)] text-foreground rounded-2xl font-bold hover:bg-[var(--muted)]/80 transition-all">Annuleren</button>
              <button onClick={() => handleSaveDelivery(editingDelivery!)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-95 transition-all">Opslaan</button>
            </div>
          </motion.div>
        </div>
      )}

      {showCompliance && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-10 overflow-hidden relative border border-border">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-foreground">Compliance - Niet Geregistreerd</h3>
              <button onClick={() => setShowCompliance(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-widest text-xs">Sluiten</button>
            </div>
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[var(--muted)] border-b border-border italic">
                  <tr className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
                    <th className="px-6 py-4">Datum</th>
                    <th className="px-6 py-4">Leverancier</th>
                    <th className="px-6 py-4">Referentie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {complianceStats.map((stat, i) => (
                    <tr key={i} className="hover:bg-[var(--muted)]/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{stat.date}</td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground">{stat.supplier}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-500">{stat.reference}</td>
                    </tr>
                  ))}
                  {complianceStats.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium italic">Geen ritten buiten compliance gevonden in de laatste 24 uur.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
