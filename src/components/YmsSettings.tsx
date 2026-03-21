import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { 
  Settings, 
  Trash2, 
  Plus, 
  MapPin, 
  Thermometer, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { YmsDock, YmsWaitingArea, YmsTemperature } from '../types';

export default function YmsSettings() {
  const { state, dispatch } = useSocket();
  const [activeTab, setActiveTab] = useState<'docks' | 'waitingAreas'>('docks');

  if (!state?.yms) return null;

  const { docks, waitingAreas } = state.yms;

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">YMS Instellingen</h2>
          <p className="text-slate-500 mt-1">Beheer uw docks en wachtplaatsen voor optimale logistiek.</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('docks')}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'docks' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Docks
        </button>
        <button
          onClick={() => setActiveTab('waitingAreas')}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'waitingAreas' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Wachtplaatsen
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'docks' ? (
          <motion.div
            key="docks"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {docks.map((dock) => (
              <div 
                key={dock.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <MapPin size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    dock.status === 'Available' ? 'bg-emerald-50 text-emerald-600' :
                    dock.status === 'Occupied' ? 'bg-amber-50 text-amber-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {dock.status === 'Available' ? 'Beschikbaar' : 
                     dock.status === 'Occupied' ? 'Bezet' : 'Geblokkeerd'}
                  </div>
                </div>

                <input
                  type="text"
                  value={dock.name}
                  onChange={(e) => handleUpdateDock({ ...dock, name: e.target.value })}
                  className="w-full text-lg font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 mb-4"
                />

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toegestane Temperaturen</p>
                  <div className="flex flex-wrap gap-2">
                    {(['Droog', 'Koel', 'Vries'] as YmsTemperature[]).map((temp) => (
                      <button
                        key={temp}
                        onClick={() => toggleTemperature(dock, temp)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          dock.allowedTemperatures.includes(temp)
                            ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <Thermometer size={12} />
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between">
                  <button
                    onClick={() => handleUpdateDock({ ...dock, status: dock.status === 'Blocked' ? 'Available' : 'Blocked' })}
                    className={`text-sm font-medium transition-colors ${
                      dock.status === 'Blocked' ? 'text-indigo-600 hover:text-indigo-700' : 'text-rose-600 hover:text-rose-700'
                    }`}
                  >
                    {dock.status === 'Blocked' ? 'Deblokkeren' : 'Blokkeren'}
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="waitingAreas"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {waitingAreas.map((wa) => (
              <div 
                key={wa.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <MapPin size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    wa.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {wa.status === 'Available' ? 'Vrij' : 'Bezet'}
                  </div>
                </div>

                <input
                  type="text"
                  value={wa.name}
                  onChange={(e) => handleUpdateWaitingArea({ ...wa, name: e.target.value })}
                  className="w-full text-lg font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 mb-4"
                />

                <p className="text-sm text-slate-500">
                  {wa.currentDeliveryId ? 'Samen met een actieve levering' : 'Geen voertuig aanwezig'}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
