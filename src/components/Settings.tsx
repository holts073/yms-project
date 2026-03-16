import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Save, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

const Settings: React.FC = () => {
  const { state, dispatch } = useSocket();
  const [terms, setTerms] = useState(state?.settings?.terms || {
    ordered: 'Ordered',
    transportRequested: 'Transport Requested',
    enRouteToWarehouse: 'En Route to Warehouse',
    delivered: 'Delivered'
  });

  const handleSave = () => {
    dispatch('UPDATE_SETTINGS', {
      ...state?.settings,
      terms
    });
    alert('Instellingen opgeslagen!');
  };

  const handleReset = () => {
    if (confirm('Weet je zeker dat je de termen wilt herstellen naar de standaardwaarden?')) {
      const defaultTerms = {
        ordered: 'Ordered',
        transportRequested: 'Transport Requested',
        enRouteToWarehouse: 'En Route to Warehouse',
        delivered: 'Delivered'
      };
      setTerms(defaultTerms);
      dispatch('UPDATE_SETTINGS', {
        ...state?.settings,
        terms: defaultTerms
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Instellingen</h2>
        <p className="text-slate-500 mt-1">Beheer de terminologie en configuratie van het systeem.</p>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Terminologie</h3>
          <p className="text-sm text-slate-500">Pas de namen van de verschillende status-stappen aan.</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status 0% (Ordered)</label>
              <input 
                type="text" 
                value={terms.ordered}
                onChange={(e) => setTerms({ ...terms, ordered: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status 25% (Transport Requested)</label>
              <input 
                type="text" 
                value={terms.transportRequested}
                onChange={(e) => setTerms({ ...terms, transportRequested: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status 50-75% (En Route)</label>
              <input 
                type="text" 
                value={terms.enRouteToWarehouse}
                onChange={(e) => setTerms({ ...terms, enRouteToWarehouse: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status 100% (Delivered)</label>
              <input 
                type="text" 
                value={terms.delivered}
                onChange={(e) => setTerms({ ...terms, delivered: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-6 flex items-center justify-between">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-full transition-all font-medium"
            >
              <RotateCcw size={18} />
              Herstel Standaard
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200"
            >
              <Save size={18} />
              Wijzigingen Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
