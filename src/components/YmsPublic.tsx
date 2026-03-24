import React from 'react';
import { useSocket } from '../SocketContext';
import { Truck, Clock, MapPin, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface YmsPublicProps {
  onBack?: () => void;
}

export default function YmsPublic({ onBack }: YmsPublicProps) {
  const { state } = useSocket();

  // Parse warehouseId from Hash query params
  const hash = window.location.hash;
  const urlParams = new URLSearchParams(hash.split('?')[1] || '');
  const warehouseId = urlParams.get('warehouseId') || 'W01';

  if (!state?.yms) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  const { deliveries = [], warehouses = [] } = state.yms;
  const currentWarehouse = warehouses.find(w => w.id === warehouseId);
  
  // Show only Arrived or At Dock deliveries for the public page, filtered by warehouse
  const activeDeliveries = deliveries
    .filter(d => d.warehouseId === warehouseId && (d.status === 'Arrived' || d.status === 'At Dock'))
    .sort((a, b) => {
      // Prioritize "At Dock"
      if (a.status === 'At Dock' && b.status !== 'At Dock') return -1;
      if (a.status !== 'At Dock' && b.status === 'At Dock') return 1;
      // Then by scheduled time
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    });

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden flex flex-col p-12 font-sans relative">
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          onClick={onBack}
          className="absolute top-12 left-12 z-50 flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Terug</span>
        </motion.button>
      )}

      <header className="flex items-center justify-between mb-16 px-4 mt-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(79,70,229,0.3)]">
            <Truck size={64} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-6xl font-black tracking-tighter uppercase italic">Yard Monitor</h1>
            <p className="text-2xl text-slate-400 font-bold tracking-widest uppercase mt-2">
                {currentWarehouse?.name || 'Magazijn'} - ILG Foodgroup
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-7xl font-mono font-black text-indigo-400 tabular-nums">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xl text-slate-500 font-bold uppercase tracking-widest mt-2">
            {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-4 gap-8 mb-8 px-8 py-6 bg-slate-900/50 rounded-3xl border border-white/5 text-slate-500 font-black text-xl uppercase tracking-[0.3em]">
          <div className="flex items-center gap-4"><Truck size={24} /> Kenteken</div>
          <div className="flex items-center gap-4"><Clock size={24} /> Tijd</div>
          <div className="flex items-center gap-4"><MapPin size={24} /> Dock</div>
          <div className="text-right">Status</div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-4 h-[calc(100%-100px)] custom-scrollbar">
          <AnimatePresence initial={false}>
            {activeDeliveries.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-64 flex items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-[3rem]"
              >
                <p className="text-4xl font-bold italic tracking-tighter">Geen actieve voertuigen op de yard</p>
              </motion.div>
            ) : (
              activeDeliveries.map((delivery) => (
                <motion.div
                  layout
                  key={delivery.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`grid grid-cols-4 gap-8 items-center px-12 py-10 rounded-[3rem] border-2 transition-all ${
                    delivery.status === 'At Dock' 
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_80px_rgba(79,70,229,0.15)]' 
                      : 'bg-slate-900 border-white/5 opacity-80'
                  }`}
                >
                  <div className="text-6xl font-black font-mono tracking-tighter uppercase tabular-nums">
                    {delivery.licensePlate || 'NR ONB'}
                  </div>
                  <div className="text-5xl font-bold text-slate-300 tabular-nums">
                    {new Date(delivery.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-7xl font-black text-indigo-400">
                    {delivery.dockId ? `DOCK ${delivery.dockId}` : delivery.waitingAreaId ? `WP ${delivery.waitingAreaId}` : '---'}
                  </div>
                  <div className="text-right">
                    <span className={`px-8 py-3 rounded-full text-2xl font-black uppercase tracking-tighter shadow-lg ${
                      delivery.status === 'At Dock' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {delivery.status === 'At Dock' ? 'Melden bij Dock' : 'Wachten'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="mt-12 flex justify-between items-center px-4 border-t border-white/5 pt-8">
        <div className="flex gap-12">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-indigo-600"></div>
            <span className="text-slate-400 font-bold uppercase tracking-widest text-lg">Direct naar dock</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-slate-800"></div>
            <span className="text-slate-400 font-bold uppercase tracking-widest text-lg">Wachten op WP nummer</span>
          </div>
        </div>
        <p className="text-slate-600 font-bold text-lg tracking-widest uppercase">Safe & Efficient Yard Management</p>
      </footer>
    </div>
  );
}
