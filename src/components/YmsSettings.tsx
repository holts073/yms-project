import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { 
  Settings as SettingsIcon, 
  Trash2, 
  Plus, 
  MapPin, 
  Thermometer, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Save,
  RotateCcw,
  Warehouse,
  Calendar,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { YmsDock, YmsWaitingArea, YmsTemperature, YmsWarehouse, YmsDockOverride, YmsWaitingAreaStatus } from '../types';

export default function YmsSettings() {
  const { state, dispatch } = useSocket();
  const [activeTab, setActiveTab] = useState<'warehouses' | 'docks' | 'waitingAreas' | 'overrides'>('warehouses');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('W01');
  const [editingWarehouse, setEditingWarehouse] = useState<Partial<YmsWarehouse> | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [newOverride, setNewOverride] = useState<Partial<YmsDockOverride>>({
    date: new Date().toISOString().split('T')[0],
    status: 'Available',
    allowedTemperatures: ['Droog']
  });
  
  if (!state?.yms) return null;

  const { warehouses = [], docks = [], waitingAreas = [], dockOverrides = [] } = state.yms;

  const handleUpdateDock = (dock: YmsDock) => {
    dispatch('YMS_UPDATE_DOCK', dock);
  };

  const handleUpdateWaitingArea = (wa: YmsWaitingArea) => {
    dispatch('YMS_UPDATE_WAITING_AREA', wa);
  };

  const toggleTemperature = (dock: YmsDock, temp: YmsTemperature) => {
    const newTemps = dock.allowedTemperatures.includes(temp)
      ? dock.allowedTemperatures.filter(t => t !== temp)
      : [...dock.allowedTemperatures, temp];
    handleUpdateDock({ ...dock, allowedTemperatures: newTemps });
  };

  const handleSaveWarehouse = (w: Partial<YmsWarehouse>) => {
    if (!w.name) return;
    const warehouse = {
      ...w,
      id: w.id || `W0${warehouses.length + 1}`
    };
    dispatch('YMS_SAVE_WAREHOUSE', warehouse);
    setEditingWarehouse(null);
  };

  const handleDeleteWarehouse = (id: string) => {
    if (id === 'W01') {
      alert('Het primaire magazijn (W01) kan niet worden verwijderd.');
      return;
    }
    if (confirm('Weet u zeker dat u dit magazijn en alle bijbehorende docks en data wilt verwijderen?')) {
      dispatch('YMS_DELETE_WAREHOUSE', id);
    }
  };

  const handleSaveOverride = () => {
    if (!newOverride.dockId || !newOverride.date) {
        alert('Selecteer een dock en datum.');
        return;
    }
    const override = {
        ...newOverride,
        id: Math.random().toString(36).substr(2, 9),
        warehouseId: selectedWarehouseId
    };
    dispatch('YMS_SAVE_DOCK_OVERRIDE', override);
    setIsOverrideModalOpen(false);
  };

  const renderWarehouses = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-foreground">Magazijnen</h3>
        <button 
          onClick={() => setEditingWarehouse({})}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} /> Nieuw Magazijn Toevoegen
        </button>
      </div>

      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--muted)]/50 border-b border-border text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
              <th className="px-8 py-5">Naam</th>
              <th className="px-8 py-5">Adres</th>
              <th className="px-8 py-5">Docks</th>
              <th className="px-8 py-5">Omschrijving</th>
              <th className="px-8 py-5 text-right">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {warehouses.map(w => (
              <tr 
                key={w.id} 
                className={`group transition-colors ${selectedWarehouseId === w.id ? 'bg-indigo-500/10' : 'hover:bg-[var(--muted)]/40'}`}
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${selectedWarehouseId === w.id ? 'bg-indigo-600 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                      <Warehouse size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{w.name}</p>
                      <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{w.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-[var(--muted-foreground)]">
                  {w.address ? (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[var(--muted-foreground)]/50" />
                      {w.address}
                    </div>
                  ) : '-'}
                </td>
                <td className="px-8 py-5">
                  <span className="px-2 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-lg text-xs font-bold border border-border">
                    {docks.filter(d => d.warehouseId === w.id).length}
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-[var(--muted-foreground)] italic max-w-xs truncate">
                  {w.description || '-'}
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setSelectedWarehouseId(w.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedWarehouseId === w.id ? 'bg-indigo-600 text-white' : 'bg-card border border-border text-foreground hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                    >
                      {selectedWarehouseId === w.id ? 'Geselecteerd' : 'Selecteren'}
                    </button>
                    <button 
                      onClick={() => setEditingWarehouse(w)}
                      className="p-2 text-[var(--muted-foreground)] hover:text-amber-600 transition-colors"
                    >
                      <SettingsIcon size={18} />
                    </button>
                    {w.id !== 'W01' && (
                      <button 
                        onClick={() => handleDeleteWarehouse(w.id)}
                        className="p-2 text-[var(--muted-foreground)] hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--muted)]/50 p-8 rounded-[2rem] border border-border">
        <div>
          <h4 className="font-bold text-foreground mb-2">Multi-Warehouse Werking</h4>
          <p className="text-sm text-[var(--muted-foreground)]">Selecteer een magazijn in de tabel om de bijbehorende docks en waiting areas te beheren. De geselecteerde instellingen zijn van toepassing op alle andere tabbladen.</p>
        </div>
        <div className="flex items-center justify-center border-l border-border pl-6">
           <div className="text-center">
             <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-1">Geselecteerd Magazijn</p>
             <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{warehouses.find(w => w.id === selectedWarehouseId)?.name}</p>
           </div>
        </div>
      </div>
    </div>
  );

  const renderOverides = () => {
    const warehouseOverrides = dockOverrides.filter(o => o.warehouseId === selectedWarehouseId);
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-foreground">Dagelijkse Instellingen (Overrides)</h3>
                <button 
                    onClick={() => setIsOverrideModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-all"
                >
                    <Plus size={16} /> Override Toevoegen
                </button>
            </div>
            
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-[var(--muted)]/50 border-b border-border italic">
                        <tr className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
                            <th className="px-6 py-4">Datum</th>
                            <th className="px-6 py-4">Dock</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Temperaturen</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {warehouseOverrides.map(o => (
                            <tr key={o.id} className="hover:bg-[var(--muted)]/40 transition-colors">
                                <td className="px-6 py-4 font-bold text-foreground">{o.date}</td>
                                <td className="px-6 py-4 font-medium text-foreground">Dock {o.dockId}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status === 'Available' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                        {o.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {o.allowedTemperatures.map(t => (
                                            <span key={t} className="text-[10px] bg-[var(--muted)] text-[var(--muted-foreground)] px-1.5 rounded border border-border">{t}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right text-[var(--muted-foreground)]/50">
                                    <button onClick={() => dispatch('Y_DELETE_DOCK_OVERRIDE', o.id)} className="hover:text-rose-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {warehouseOverrides.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted-foreground)] font-medium">
                                    Geen actieve overrides voor dit magazijn.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">YMS Instellingen</h2>
          <p className="text-[var(--muted-foreground)] mt-1">Beheer uw multi-warehouse yard setup en docks.</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-[var(--muted)]/50 border border-border rounded-2xl w-fit">
        {['warehouses', 'docks', 'waitingAreas', 'overrides'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab 
                ? 'bg-card text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-[var(--muted-foreground)] hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'warehouses' && (
          <motion.div key="warehouses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {renderWarehouses()}
          </motion.div>
        )}

        {activeTab === 'docks' && (
          <motion.div key="docks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="col-span-full mb-2">
                <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Geselecteerd: {warehouses.find(w => w.id === selectedWarehouseId)?.name}</span>
            </div>
            {docks.filter(d => d.warehouseId === selectedWarehouseId).map((dock) => (
              <div key={dock.id} className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <MapPin size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    dock.status === 'Available' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                    dock.status === 'Occupied' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  }`}>
                    {dock.status === 'Available' ? 'Vrij' : dock.status === 'Occupied' ? 'Bezet' : 'Blok'}
                  </div>
                </div>
                <input
                  type="text"
                  value={dock.name}
                  onChange={(e) => handleUpdateDock({ ...dock, name: e.target.value })}
                  className="w-full text-lg font-bold text-foreground bg-transparent border-none p-0 focus:ring-0 mb-4"
                />
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Temperaturen</p>
                  <div className="flex flex-wrap gap-2">
                    {(['Droog', 'Koel', 'Vries', 'Fast Lane'] as YmsTemperature[]).map((temp) => (
                      <button
                        key={temp}
                        onClick={() => toggleTemperature(dock, temp)}
                        className={`flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          dock.allowedTemperatures.includes(temp) ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                        }`}
                      >
                        <Thermometer size={10} /> {temp}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateDock({ ...dock, isFastLane: !dock.isFastLane })}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                      dock.isFastLane ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20 shadow-sm' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {dock.isFastLane ? 'FAST LANE: AAN' : 'GEEN FAST LANE'}
                  </button>
                  <button
                    onClick={() => handleUpdateDock({ ...dock, isOutboundOnly: !dock.isOutboundOnly })}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                      dock.isOutboundOnly ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20 shadow-sm' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {dock.isOutboundOnly ? 'OUTBOUND ONLY' : 'ALLE RICHTINGEN'}
                  </button>
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <button
                    onClick={() => handleUpdateDock({ ...dock, status: dock.status === 'Blocked' ? 'Available' : 'Blocked' })}
                    className={`text-xs font-bold transition-colors ${dock.status === 'Blocked' ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}
                  >
                    {dock.status === 'Blocked' ? 'Deblokkeren' : 'Blokkeren'}
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'waitingAreas' && (
          <motion.div key="waitingAreas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {waitingAreas.filter(wa => wa.warehouseId === selectedWarehouseId).map((wa) => (
              <div key={wa.id} className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-2xl group-hover:bg-slate-900 dark:group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <MapPin size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    wa.adminStatus === 'Blocked' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' :
                    wa.adminStatus === 'Deactivated' ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' :
                    wa.status === 'Available' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  }`}>
                    {wa.adminStatus === 'Blocked' ? 'Geblokkeerd' :
                     wa.adminStatus === 'Deactivated' ? 'Uitgeschakeld' :
                     wa.status === 'Available' ? 'Vrij' : 'Bezet'}
                  </div>
                </div>
                <input
                  type="text"
                  value={wa.name}
                  onChange={(e) => handleUpdateWaitingArea({ ...wa, name: e.target.value })}
                  className="w-full text-lg font-bold text-foreground bg-transparent border-none p-0 focus:ring-0 mb-4"
                />
                <p className="text-xs text-[var(--muted-foreground)] font-medium mb-4">{wa.currentDeliveryId ? 'Voertuig aanwezig' : 'Leeg'}</p>
                <div className="flex gap-1">
                  {(['Active', 'Deactivated', 'Blocked'] as YmsWaitingAreaStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateWaitingArea({ ...wa, adminStatus: status })}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        (wa.adminStatus || 'Active') === status 
                          ? status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 
                            status === 'Deactivated' ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                      }`}
                    >
                      {status === 'Active' ? 'Actief' : status === 'Deactivated' ? 'Uit' : 'Blok'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'overrides' && (
          <motion.div key="overrides" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {renderOverides()}
          </motion.div>
        )}
      </AnimatePresence>

      {editingWarehouse && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 overflow-hidden relative">
            <h3 className="text-2xl font-bold mb-8 text-foreground">Nieuw Magazijn</h3>
            <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Naam</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[var(--muted)] border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground dark:bg-slate-800"
                    value={editingWarehouse.name || ''}
                    onChange={(e) => setEditingWarehouse({...editingWarehouse, name: e.target.value})}
                    placeholder="bijv. Magazijn 02"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Beschrijving</label>
                  <textarea
                    className="w-full px-4 py-3 bg-[var(--muted)] border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold h-20 resize-none text-foreground dark:bg-slate-800"
                    value={editingWarehouse.description || ''}
                    onChange={(e) => setEditingWarehouse({...editingWarehouse, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Adres</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[var(--muted)] border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground dark:bg-slate-800"
                    value={editingWarehouse.address || ''}
                    onChange={(e) => setEditingWarehouse({...editingWarehouse, address: e.target.value})}
                    placeholder="bijv. Newtonweg 15, Venlo"
                  />
                </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setEditingWarehouse(null)} className="flex-1 py-4 bg-[var(--muted)] text-foreground rounded-2xl font-bold">Annuleren</button>
              <button onClick={() => handleSaveWarehouse(editingWarehouse)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20">Opslaan</button>
            </div>
          </motion.div>
        </div>
      )}

      {isOverrideModalOpen && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 overflow-hidden relative">
            <h3 className="text-2xl font-bold mb-8 text-foreground">Override Toevoegen</h3>
            <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Dock</label>
                  <select 
                    className="w-full px-4 py-3 bg-[var(--muted)] border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground dark:bg-slate-800"
                    value={newOverride.dockId || ''}
                    onChange={(e) => setNewOverride({...newOverride, dockId: parseInt(e.target.value)})}
                  >
                    <option value="">Selecteer dock...</option>
                    {docks.filter(d => d.warehouseId === selectedWarehouseId).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Datum</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-[var(--muted)] border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground dark:bg-slate-800"
                    value={newOverride.date}
                    onChange={(e) => setNewOverride({...newOverride, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Status</label>
                  <select 
                    className="w-full px-4 py-3 bg-[var(--muted)] border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-foreground dark:bg-slate-800"
                    value={newOverride.status}
                    onChange={(e) => setNewOverride({...newOverride, status: e.target.value as any})}
                  >
                    <option value="Available">Vrij</option>
                    <option value="Blocked">Blokkeren</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Temperaturen</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Droog', 'Koel', 'Vries'] as YmsTemperature[]).map((temp) => (
                      <button
                        key={temp}
                        onClick={() => {
                            const temps = newOverride.allowedTemperatures || [];
                            const newTemps = temps.includes(temp) 
                                ? temps.filter(t => t !== temp)
                                : [...temps, temp];
                            setNewOverride({...newOverride, allowedTemperatures: newTemps});
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          newOverride.allowedTemperatures?.includes(temp) ? 'bg-indigo-600 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                        }`}
                      >
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsOverrideModalOpen(false)} className="flex-1 py-4 bg-[var(--muted)] text-foreground rounded-2xl font-bold">Annuleren</button>
              <button onClick={handleSaveOverride} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20">Opslaan</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
