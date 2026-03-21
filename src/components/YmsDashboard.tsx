import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search,
  MoreVertical,
  User,
  Zap,
  Warehouse,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Bot
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { YmsDelivery, YmsTemperature, YmsDeliveryStatus, YmsDock, YmsWaitingArea } from '../types';
import { getStatusLabel, YMS_STATUS_FLOW, isValidTransition } from '../lib/ymsRules';

export default function YmsDashboard() {
  const { state, dispatch } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Partial<YmsDelivery> | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('W01');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAlerts, setShowAlerts] = useState(false);

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
    d.scheduledTime.startsWith(selectedDate)
  );

  const handleSaveDelivery = (d: Partial<YmsDelivery>) => {
    const supplier = state.addressBook.suppliers.find(s => s.id === d.supplierId);
    const delivery = {
      ...d,
      id: d.id || Math.random().toString(36).substr(2, 9),
      warehouseId: selectedWarehouseId,
      supplier: supplier?.name || d.supplier || 'Onbekend',
      status: d.status || 'Scheduled',
      scheduledTime: d.scheduledTime || `${selectedDate}T${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}:00Z`
    };
    dispatch('YMS_SAVE_DELIVERY', delivery);
    setIsModalOpen(false);
    setEditingDelivery(null);
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

  const filteredDeliveries = currentDeliveries.filter(d => 
    d.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const changeDate = (days: number) => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + days);
      setSelectedDate(d.toISOString().split('T')[0]);
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const reeferAlertCount = activeAlerts.length;

  const handleAutoSchedule = () => {
    dispatch('YMS_AUTO_SCHEDULE', { warehouseId: selectedWarehouseId });
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">YMS Dashboard</h2>
            <div className="flex items-center gap-4 mt-1">
                <select 
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-lg border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg">
                    <button onClick={() => changeDate(-1)} className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-indigo-600"><ChevronLeft size={14}/></button>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 min-w-24 justify-center">
                        <CalendarIcon size={14} className="text-slate-400" />
                        {new Date(selectedDate).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}
                    </div>
                    <button onClick={() => changeDate(1)} className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-indigo-600"><ChevronRight size={14}/></button>
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
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {reeferAlertCount > 0 && (
            <button 
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 hover:bg-rose-100 transition-all shadow-sm"
            >
              <ShieldAlert size={20} className="animate-pulse" />
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                {reeferAlertCount}
              </span>
            </button>
          )}

          <button
            onClick={handleAutoSchedule}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95 group text-sm"
          >
            <Bot size={18} className="group-hover:rotate-12 transition-transform" />
            AI Optimize
          </button>

          <button
            onClick={() => window.location.href = `#/yms-public?warehouseId=${selectedWarehouseId}`} 
            className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all border border-slate-200"
          >
            <Zap size={20} /> Monitor
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all border border-slate-200"
          >
            {viewMode === 'list' ? 'Timeline' : 'Lijst'}
          </button>
          <button
            onClick={() => { setEditingDelivery({ status: 'Scheduled', temperature: 'Droog', isReefer: false, tempAlertThreshold: 30 }); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            <Plus size={20} /> Nieuw
          </button>
        </div>
      </div>

      {/* Alerts Overlay */}
      {showAlerts && activeAlerts.length > 0 && (
        <div className="absolute top-24 right-8 w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-50 max-h-[70vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                    <ShieldAlert size={18} className="text-rose-500" />
                    Actieve Waarschuwingen
                </h3>
                <button onClick={() => setShowAlerts(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><Plus size={18} className="rotate-45" /></button>
            </div>
            <div className="space-y-3">
                {activeAlerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-2xl border ${alert.severity === 'high' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex justify-between items-start gap-2">
                            <p className={`text-xs font-bold ${alert.severity === 'high' ? 'text-rose-700' : 'text-amber-700'}`}>{alert.message}</p>
                            <button 
                                onClick={() => dispatch('YMS_RESOLVE_ALERT', alert.id)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <CheckCircle2 size={16} />
                            </button>
                        </div>
                        <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 mt-2">
                            {new Date(alert.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'list' ? (
          <div className="xl:col-span-3 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
            <div className="flex gap-4 mb-2 overflow-x-auto pb-2 scrollbar-hide">
              {['PLANNED', 'GATE_IN', 'IN_YARD', 'DOCKED', 'UNLOADING', 'LOADING'].map(s => (
                <div key={s} className={cn(
                  "px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                  s === 'PLANNED' ? "bg-slate-100 text-slate-600" :
                  s === 'GATE_IN' ? "bg-amber-50 text-amber-700" :
                  s === 'IN_YARD' ? "bg-orange-50 text-orange-700" :
                  s === 'DOCKED' ? "bg-indigo-50 text-indigo-700" :
                  s === 'UNLOADING' || s === 'LOADING' ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                )}>
                  {getStatusLabel(s as any)} ({currentDeliveries.filter(d => d.status === s).length})
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              {filteredDeliveries.map(delivery => (
                <motion.div layout key={delivery.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${
                        delivery.status === 'PLANNED' ? 'bg-slate-50 text-slate-400' :
                        delivery.status === 'GATE_IN' ? 'bg-amber-50 text-amber-600' :
                        delivery.status === 'IN_YARD' ? 'bg-orange-50 text-orange-600' :
                        delivery.status === 'DOCKED' ? 'bg-indigo-50 text-indigo-600' :
                        delivery.status === 'UNLOADING' || delivery.status === 'LOADING' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        <Truck size={32} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-bold text-slate-900">{delivery.reference}</h4>
                          <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            delivery.temperature === 'Vries' ? 'bg-blue-100 text-blue-700' :
                            delivery.temperature === 'Koel' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {delivery.temperature}
                          </span>
                          {delivery.priorityScore && delivery.priorityScore > 0 && (
                             <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-indigo-100">
                               <TrendingUp size={10} /> {delivery.priorityScore} pts
                             </span>
                          )}
                          {delivery.isReefer && (
                             <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-rose-100">
                               Reefer
                             </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-slate-500 text-sm">
                          <span className="flex items-center gap-1"><User size={14}/> {delivery.supplier}</span>
                          <span className="flex items-center gap-1 font-mono bg-slate-100 px-2 rounded-md font-bold">{delivery.licensePlate || 'NR ONBEKEND'}</span>
                          {delivery.transporterId && (
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                               ({state.addressBook.transporters.find(t => t.id === delivery.transporterId)?.name})
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
                          <p className={`font-bold ${delivery.predictedEta ? 'text-slate-400 line-through text-xs' : 'text-slate-900'}`}>{new Date(delivery.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          {delivery.predictedEta && (
                            <p className="font-black text-indigo-600 flex items-center gap-1">
                               <Bot size={12} />
                               {new Date(delivery.predictedEta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="h-10 w-px bg-slate-100" />
                      <div className="flex gap-2">
                        {delivery.status === 'PLANNED' && (
                          <button onClick={() => handleUpdateStatus(delivery, 'GATE_IN')} className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 transition-all flex items-center gap-2"><MapPin size={16} /> Melden</button>
                        )}
                        {(delivery.status === 'GATE_IN' || delivery.status === 'PLANNED') && (
                          <div className="relative group/assign">
                            <button className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl font-bold text-sm hover:bg-orange-100 transition-all flex items-center gap-2"><Warehouse size={16} /> Yard/Dock</button>
                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl opacity-0 invisible group-hover/assign:opacity-100 group-hover/assign:visible transition-all z-10 p-4">
                              <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-tighter">Beschikbare Docks</p>
                              <div className="grid grid-cols-4 gap-2">
                                {currentDocks.filter(dk => dk.status === 'Available' && dk.allowedTemperatures.includes(delivery.temperature)).map(dk => (
                                  <button key={dk.id} onClick={() => handleAssignToDock(delivery, dk.id)} className="p-2 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all">{dk.id}</button>
                                ))}
                              </div>
                              <p className="text-xs font-bold text-slate-400 my-3 uppercase tracking-tighter">Wachtplaatsen</p>
                              <div className="grid grid-cols-5 gap-2">
                                {currentWaitingAreas.filter(wa => wa.status === 'Available').map(wa => (
                                  <button key={wa.id} onClick={() => handleAssignToWaitingArea(delivery, wa.id)} className="p-2 bg-slate-50 hover:bg-orange-600 hover:text-white rounded-lg text-xs font-bold transition-all">{wa.id}</button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {delivery.status === 'IN_YARD' && (
                           <div className="relative group/yard-to-dock">
                              <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center gap-2"><MapPin size={16} /> Naar Dock</button>
                              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl opacity-0 invisible group-hover/yard-to-dock:opacity-100 group-hover/yard-to-dock:visible transition-all z-10 p-4">
                                <div className="grid grid-cols-4 gap-2">
                                  {currentDocks.filter(dk => dk.status === 'Available' && dk.allowedTemperatures.includes(delivery.temperature)).map(dk => (
                                    <button key={dk.id} onClick={() => handleAssignToDock(delivery, dk.id)} className="p-2 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all">{dk.id}</button>
                                  ))}
                                </div>
                              </div>
                           </div>
                        )}
                        {delivery.status === 'DOCKED' && (
                          <div className="flex gap-2">
                             <button onClick={() => handleUpdateStatus(delivery, 'UNLOADING')} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center gap-2">Lossen</button>
                             <button onClick={() => handleUpdateStatus(delivery, 'LOADING')} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center gap-2">Laden</button>
                          </div>
                        )}
                        {(delivery.status === 'UNLOADING' || delivery.status === 'LOADING') && (
                          <button onClick={() => handleUpdateStatus(delivery, 'COMPLETED')} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center gap-2"><CheckCircle2 size={16} /> Gereed</button>
                        )}
                        {delivery.status === 'COMPLETED' && (
                          <button onClick={() => handleUpdateStatus(delivery, 'GATE_OUT')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2">Vertrokken</button>
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
          <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
            <div className="flex-1 overflow-auto custom-scrollbar relative">
              <div className="flex sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                <div className="w-40 flex-shrink-0 border-r border-slate-200 p-4 font-bold text-xs text-slate-400 uppercase tracking-widest bg-slate-50">Docks</div>
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="w-[200px] flex-shrink-0 p-4 border-r border-slate-100 text-sm font-bold text-slate-600 text-center">{i + 7}:00</div>
                ))}
              </div>

              <div className="relative">
                {currentDocks.map(dock => (
                  <div key={dock.id} className={`flex border-b border-slate-100 group ${dock.status === 'Blocked' ? 'bg-slate-50/50 grayscale' : ''}`}>
                    <div className="w-40 flex-shrink-0 border-r border-slate-200 p-4 bg-slate-50/50 group-hover:bg-slate-100 transition-colors">
                      <div className="font-bold text-slate-900 flex justify-between items-center">
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
                        <div key={i} className="w-[200px] border-r border-slate-50 flex-shrink-0" />
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
                            drag
                            dragMomentum={false}
                            onDragEnd={(_, info) => {
                              const rowHeight = 96;
                              const dockDelta = Math.round(info.offset.y / rowHeight);
                              if (dockDelta !== 0) {
                                const dockIndex = currentDocks.findIndex(dk => dk.id === dock.id);
                                const newDockIdx = dockIndex + dockDelta;
                                if (newDockIdx >= 0 && newDockIdx < currentDocks.length) {
                                  handleAssignToDock(delivery, currentDocks[newDockIdx].id);
                                }
                              }
                              
                              const hourWidth = 200;
                              const timeDeltaMinutes = (info.offset.x / hourWidth) * 60;
                              if (Math.abs(timeDeltaMinutes) > 5) {
                                const newDate = new Date(delivery.scheduledTime);
                                newDate.setMinutes(newDate.getMinutes() + timeDeltaMinutes);
                                handleSaveDelivery({ ...delivery, scheduledTime: newDate.toISOString() });
                              }
                            }}
                            className="absolute top-2 h-20 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg p-3 cursor-grab active:cursor-grabbing z-10 hover:border-indigo-500 transition-colors group/card"
                            style={{ left: leftPos }}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                                delivery.status === 'DOCKED' ? 'bg-indigo-100 text-indigo-700' : 
                                delivery.status === 'UNLOADING' || delivery.status === 'LOADING' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 overflow-hidden relative">
            <h3 className="text-2xl font-bold mb-8">{editingDelivery?.id ? 'Bewerken' : 'Nieuwe Levering'}</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Referentie</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold" value={editingDelivery?.reference || ''} onChange={(e) => setEditingDelivery({...editingDelivery, reference: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kenteken</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold uppercase tracking-wider" value={editingDelivery?.licensePlate || ''} onChange={(e) => setEditingDelivery({...editingDelivery, licensePlate: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Leverancier</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold" value={editingDelivery?.supplierId || ''} onChange={(e) => setEditingDelivery({...editingDelivery, supplierId: e.target.value})}>
                    <option value="">Selecteer</option>
                    {state.addressBook.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transporteur</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold" value={editingDelivery?.transporterId || ''} onChange={(e) => setEditingDelivery({...editingDelivery, transporterId: e.target.value})}>
                    <option value="">Selecteer</option>
                    {state.addressBook.transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tijd (HH:mm)</label>
                  <input type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold" value={editingDelivery?.scheduledTime ? new Date(editingDelivery.scheduledTime).toTimeString().substr(0, 5) : ''} onChange={(e) => {
                      const [h, m] = e.target.value.split(':');
                      const d = new Date(editingDelivery?.scheduledTime || `${selectedDate}T00:00:00Z`);
                      d.setHours(parseInt(h), parseInt(m), 0, 0);
                      setEditingDelivery({...editingDelivery, scheduledTime: d.toISOString()});
                  }} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Temperatuur</label>
                   <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold" value={editingDelivery?.temperature || 'Droog'} onChange={(e) => setEditingDelivery({...editingDelivery, temperature: e.target.value as YmsTemperature})}>
                        <option value="Droog">Droog</option>
                        <option value="Koel">Koel</option>
                        <option value="Vries">Vries</option>
                   </select>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Annuleren</button>
              <button onClick={() => handleSaveDelivery(editingDelivery!)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">Opslaan</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
