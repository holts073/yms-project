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
  ChevronRight,
  MoreVertical,
  ArrowRight,
  User,
  Calendar,
  Thermometer,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { YmsDelivery, YmsDock, YmsWaitingArea, YmsTemperature, YmsDeliveryStatus } from '../types';

export default function YmsDashboard() {
  const { state, dispatch } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Partial<YmsDelivery> | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');

  if (!state?.yms) return null;

  const { deliveries, docks, waitingAreas } = state.yms;

  const handleSaveDelivery = (d: Partial<YmsDelivery>) => {
    const supplier = state.addressBook.suppliers.find(s => s.id === d.supplierId);
    const delivery = {
      ...d,
      id: d.id || Math.random().toString(36).substr(2, 9),
      supplier: supplier?.name || d.supplier || 'Onbekend',
      status: d.status || 'Scheduled',
      scheduledTime: d.scheduledTime || new Date().toISOString()
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
    const updates: Partial<YmsDelivery> = { ...d, status };
    
    if (status === 'Arrived') {
      updates.arrivalTime = new Date().toISOString();
    } else if (status === 'Completed') {
      // Clear dock/waiting area
      if (d.dockId) {
        const dock = docks.find(dk => dk.id === d.dockId);
        if (dock) dispatch('YMS_UPDATE_DOCK', { ...dock, status: 'Available', currentDeliveryId: null });
        updates.dockId = undefined;
      }
      if (d.waitingAreaId) {
        const wa = waitingAreas.find(w => w.id === d.waitingAreaId);
        if (wa) dispatch('YMS_UPDATE_WAITING_AREA', { ...wa, status: 'Available', currentDeliveryId: null });
        updates.waitingAreaId = undefined;
      }
    }
    
    dispatch('YMS_SAVE_DELIVERY', { ...d, ...updates });
  };

  const handleAssignToDock = (d: YmsDelivery, dockId: number) => {
    const dock = docks.find(dk => dk.id === dockId);
    if (!dock) return;

    // Clear previous dock if any
    if (d.dockId && d.dockId !== dockId) {
      const prevDock = docks.find(dk => dk.id === d.dockId);
      if (prevDock) dispatch('YMS_UPDATE_DOCK', { ...prevDock, status: 'Available', currentDeliveryId: null });
    }
    // Clear waiting area if any
    if (d.waitingAreaId) {
      const wa = waitingAreas.find(w => w.id === d.waitingAreaId);
      if (wa) dispatch('YMS_UPDATE_WAITING_AREA', { ...wa, status: 'Available', currentDeliveryId: null });
    }

    dispatch('YMS_UPDATE_DOCK', { ...dock, status: 'Occupied', currentDeliveryId: d.id });
    dispatch('YMS_SAVE_DELIVERY', { ...d, dockId, waitingAreaId: null, status: 'At Dock' });
  };

  const handleAssignToWaitingArea = (d: YmsDelivery, waId: number) => {
    const wa = waitingAreas.find(w => w.id === waId);
    if (!wa) return;

    // Clear previous WA if any
    if (d.waitingAreaId && d.waitingAreaId !== waId) {
      const prevWa = waitingAreas.find(w => w.id === d.waitingAreaId);
      if (prevWa) dispatch('YMS_UPDATE_WAITING_AREA', { ...prevWa, status: 'Available', currentDeliveryId: null });
    }
    // Clear dock if any
    if (d.dockId) {
      const dock = docks.find(dk => dk.id === d.dockId);
      if (dock) dispatch('YMS_UPDATE_DOCK', { ...dock, status: 'Available', currentDeliveryId: null });
    }

    dispatch('YMS_UPDATE_WAITING_AREA', { ...wa, status: 'Occupied', currentDeliveryId: d.id });
    dispatch('YMS_SAVE_DELIVERY', { ...d, waitingAreaId: waId, dockId: null, status: 'Arrived' });
  };

  const filteredDeliveries = deliveries.filter(d => 
    d.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">YMS Dashboard</h2>
          <p className="text-slate-500 mt-1">Real-time overzicht van alle yard-bewegingen.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Zoeken op referentie, kenteken..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => window.location.href = '#/yms-public'} 
            className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all border border-slate-200"
          >
            <Zap size={20} />
            Publieke Monitor
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all border border-slate-200"
          >
            {viewMode === 'list' ? 'Timeline Weergave' : 'Lijst Weergave'}
          </button>
          <button
            onClick={() => { setEditingDelivery({ status: 'Scheduled', temperature: 'Droog' }); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            <Plus size={20} />
            Nieuwe Levering
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1 overflow-hidden">
                {/* Previous List View Content... */}
        {/* Left Column: List of Deliveries */}
        <div className="xl:col-span-3 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
          <div className="flex gap-4 mb-2">
            <div className="bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Gepland ({filteredDeliveries.filter(d => d.status === 'Scheduled').length})
            </div>
            <div className="bg-amber-50 text-amber-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Aangekomen ({filteredDeliveries.filter(d => d.status === 'Arrived').length})
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Aan Dock ({filteredDeliveries.filter(d => d.status === 'At Dock').length})
            </div>
          </div>

          <div className="grid gap-4">
            {filteredDeliveries.map(delivery => (
              <motion.div
                layout
                key={delivery.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl ${
                      delivery.status === 'Scheduled' ? 'bg-blue-50 text-blue-600' :
                      delivery.status === 'Arrived' ? 'bg-amber-50 text-amber-600' :
                      delivery.status === 'At Dock' ? 'bg-indigo-50 text-indigo-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      <Truck size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-bold text-slate-900">{delivery.reference}</h4>
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          delivery.temperature === 'Vries' ? 'bg-blue-100 text-blue-700' :
                          delivery.temperature === 'Koel' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {delivery.temperature}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-slate-500 text-sm">
                        <span className="flex items-center gap-1"><User size={14}/> {delivery.supplier}</span>
                        <span className="flex items-center gap-1 font-mono bg-slate-100 px-2 rounded-md font-bold">{delivery.licensePlate}</span>
                        {delivery.transporterId && (
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                             ({state.addressBook.transporters.find(t => t.id === delivery.transporterId)?.name})
                           </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {delivery.isLate && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-rose-100 animate-pulse">
                            <AlertCircle size={10} /> Te laat aangemeld (&gt;24u)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Tijdschema</p>
                      <p className="font-bold text-slate-900">{new Date(delivery.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>

                    <div className="h-10 w-px bg-slate-100" />

                    <div className="flex gap-2">
                      {delivery.status === 'Scheduled' && (
                        <button
                          onClick={() => handleUpdateStatus(delivery, 'Arrived')}
                          className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 transition-all flex items-center gap-2"
                        >
                          <Zap size={16} /> Aangemeld
                        </button>
                      )}
                      
                      {(delivery.status === 'Arrived' || delivery.status === 'Scheduled') && (
                        <div className="relative group/assign">
                          <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center gap-2">
                            <MapPin size={16} /> Toewijzen
                          </button>
                          <div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl opacity-0 invisible group-hover/assign:opacity-100 group-hover/assign:visible transition-all z-10 p-4">
                            <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-tighter">Beschikbare Docks</p>
                            <div className="grid grid-cols-4 gap-2">
                              {docks.filter(dk => dk.status === 'Available' && dk.allowedTemperatures.includes(delivery.temperature)).map(dk => (
                                <button
                                  key={dk.id}
                                  onClick={() => handleAssignToDock(delivery, dk.id)}
                                  className="p-2 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                                >
                                  {dk.id}
                                </button>
                              ))}
                            </div>
                            <p className="text-xs font-bold text-slate-400 my-3 uppercase tracking-tighter">Wachtplaatsen</p>
                            <div className="grid grid-cols-5 gap-2">
                              {waitingAreas.filter(wa => wa.status === 'Available').map(wa => (
                                <button
                                  key={wa.id}
                                  onClick={() => handleAssignToWaitingArea(delivery, wa.id)}
                                  className="p-2 bg-slate-50 hover:bg-amber-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                                >
                                  {wa.id}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {delivery.status === 'At Dock' && (
                        <button
                          onClick={() => handleUpdateStatus(delivery, 'Completed')}
                          className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} /> Gereed
                        </button>
                      )}

                      <button 
                        onClick={() => { setEditingDelivery(delivery); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-slate-600"
                      >
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
              <div className="flex-1 overflow-auto custom-scrollbar relative">
                {/* Timeline Header (Hours) */}
                <div className="flex sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                  <div className="w-40 flex-shrink-0 border-r border-slate-200 p-4 font-bold text-xs text-slate-400 uppercase tracking-widest bg-slate-50">Docks</div>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="w-[200px] flex-shrink-0 p-4 border-r border-slate-100 text-sm font-bold text-slate-600 text-center">
                      {i + 7}:00
                    </div>
                  ))}
                </div>

                {/* Timeline Rows (Docks) */}
                <div className="relative">
                  {docks.map(dock => (
                    <div key={dock.id} className="flex border-b border-slate-100 group">
                      <div className="w-40 flex-shrink-0 border-r border-slate-200 p-4 bg-slate-50/50 group-hover:bg-slate-100 transition-colors">
                        <div className="font-bold text-slate-900">{dock.name}</div>
                        <div className="flex gap-1 mt-1">
                          {dock.allowedTemperatures.map(temp => (
                            <div key={temp} className={`w-2 h-2 rounded-full ${
                              temp === 'Vries' ? 'bg-blue-400' : temp === 'Koel' ? 'bg-indigo-400' : 'bg-amber-400'
                            }`} title={temp} />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex-1 flex relative h-24 min-w-[3200px]">
                        {/* Grid Lines */}
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="w-[200px] border-r border-slate-50 flex-shrink-0" />
                        ))}
                        
                        {/* Deliveries for this Dock */}
                        {deliveries.filter(d => d.dockId === dock.id && d.status !== 'Completed').map(delivery => {
                          const date = new Date(delivery.scheduledTime);
                          const startHour = 7;
                          const hour = date.getHours();
                          const min = date.getMinutes();
                          const offsetPercent = ((hour - startHour) * 60 + min) / (16 * 60) * 100;
                          const leftPos = (hour - startHour) * 200 + (min / 60) * 200;
                          
                          return (
                            <motion.div
                              layoutId={delivery.id}
                              key={delivery.id}
                              drag
                              dragMomentum={false}
                              onDragEnd={(_, info) => {
                                // Vertical drag for dock change
                                const rowHeight = 96; // h-24
                                const dockDelta = Math.round(info.offset.y / rowHeight);
                                if (dockDelta !== 0) {
                                  const dockIndex = docks.findIndex(dk => dk.id === dock.id);
                                  const newDock = docks[dockIndex + dockDelta];
                                  if (newDock) handleAssignToDock(delivery, newDock.id);
                                }
                                
                                // Horizontal drag for time change
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
                                  delivery.status === 'At Dock' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {delivery.status}
                                </span>
                                <MoreVertical size={12} className="text-slate-300 group-hover/card:text-slate-500" />
                              </div>
                              <p className="font-bold text-xs mt-1 truncate">{delivery.reference}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{delivery.licensePlate || 'GEEN NR'}</p>
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
                  
                  {/* Current Time Indicator */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                    style={{ 
                      left: 160 + (Math.max(0, Math.min(16 * 60, (new Date().getHours() - 7) * 60 + new Date().getMinutes())) / (16 * 60)) * 3200
                    }}
                  >
                    <div className="bg-rose-500 text-white text-[8px] font-black px-1 rounded-sm absolute -top-4 -left-3">NU</div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 overflow-hidden relative"
          >
            <h3 className="text-2xl font-bold mb-8">{editingDelivery?.id ? 'Levering Bewerken' : 'Nieuwe Levering'}</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Referentie</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                    value={editingDelivery?.reference || ''}
                    onChange={(e) => setEditingDelivery({...editingDelivery, reference: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kenteken</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold uppercase tracking-wider"
                    value={editingDelivery?.licensePlate || ''}
                    onChange={(e) => setEditingDelivery({...editingDelivery, licensePlate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Leverancier</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold appearance-none"
                    value={editingDelivery?.supplierId || ''}
                    onChange={(e) => setEditingDelivery({...editingDelivery, supplierId: e.target.value})}
                  >
                    <option value="">Selecteer Leverancier</option>
                    {state.addressBook.suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transporteur</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold appearance-none"
                    value={editingDelivery?.transporterId || ''}
                    onChange={(e) => setEditingDelivery({...editingDelivery, transporterId: e.target.value})}
                  >
                    <option value="">Selecteer Transporteur</option>
                    {state.addressBook.transporters.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tijd (HH:mm)</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                    value={editingDelivery?.scheduledTime ? new Date(editingDelivery.scheduledTime).toTimeString().substr(0, 5) : ''}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':');
                      const d = new Date();
                      d.setHours(parseInt(h), parseInt(m), 0, 0);
                      setEditingDelivery({...editingDelivery, scheduledTime: d.toISOString()});
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Temperatuur</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold appearance-none"
                    value={editingDelivery?.temperature || 'Droog'}
                    onChange={(e) => setEditingDelivery({...editingDelivery, temperature: e.target.value as YmsTemperature})}
                  >
                    <option value="Droog">Droog</option>
                    <option value="Koel">Koel</option>
                    <option value="Vries">Vries</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleSaveDelivery(editingDelivery!)}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
              >
                Opslaan
              </button>
            </div>

            {editingDelivery?.id && (
              <button
                onClick={() => handleDeleteDelivery(editingDelivery.id!)}
                className="absolute top-8 right-8 text-rose-600 hover:text-rose-700 font-bold text-sm"
              >
                Verwijderen
              </button>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
