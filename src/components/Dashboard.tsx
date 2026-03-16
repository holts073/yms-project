import React from 'react';
import { useSocket } from '../SocketContext';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Package,
  FileText,
  Truck as TruckIcon
} from 'lucide-react';
import { motion } from 'motion/react';

const Dashboard = () => {
  const { state } = useSocket();
  const { deliveries = [] } = state || {};

  // Calculate action items (missing documents)
  const actionItems = deliveries.filter(d => 
    d.documents.some(doc => doc.required && doc.status === 'missing')
  );

  const activeDeliveries = deliveries.filter(d => d.status < 100);

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welkom terug</h2>
        <p className="text-slate-500 mt-1">Hier is een overzicht van de huidige status van je leveringen.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertCircle size={24} />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">Actie vereist</span>
          </div>
          <p className="text-4xl font-bold text-slate-900">{actionItems.length}</p>
          <p className="text-slate-500 text-sm mt-1">Leveringen met ontbrekende documenten</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Clock size={24} />
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">Onderweg</span>
          </div>
          <p className="text-4xl font-bold text-slate-900">{activeDeliveries.length}</p>
          <p className="text-slate-500 text-sm mt-1">Actieve leveringen in transit</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">Voltooid</span>
          </div>
          <p className="text-4xl font-bold text-slate-900">{deliveries.length - activeDeliveries.length}</p>
          <p className="text-slate-500 text-sm mt-1">Leveringen succesvol afgehandeld</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Containers Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Package size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Containers</h3>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
              {deliveries.filter(d => d.type === 'container' && d.status < 100).length} Actief
            </span>
          </div>
          <div className="space-y-4">
            {deliveries.filter(d => d.type === 'container' && d.status < 100).length > 0 ? (
              deliveries.filter(d => d.type === 'container' && d.status < 100).map((delivery) => (
                <DashboardItem key={delivery.id} delivery={delivery} />
              ))
            ) : (
              <EmptyState message="Geen actieve containers." />
            )}
          </div>
        </section>

        {/* ExWorks Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                <TruckIcon size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Ex-Works</h3>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase">
              {deliveries.filter(d => d.type === 'exworks' && d.status < 100).length} Actief
            </span>
          </div>
          <div className="space-y-4">
            {deliveries.filter(d => d.type === 'exworks' && d.status < 100).length > 0 ? (
              deliveries.filter(d => d.type === 'exworks' && d.status < 100).map((delivery) => (
                <DashboardItem key={delivery.id} delivery={delivery} />
              ))
            ) : (
              <EmptyState message="Geen actieve ex-works leveringen." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const DashboardItem = ({ delivery }: { delivery: any, key?: string }) => {
  const missingDocs = delivery.documents.filter((doc: any) => doc.required && doc.status === 'missing').length;
  
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-900">{delivery.reference}</h4>
          <span className="text-xs font-bold text-slate-400">{delivery.status}%</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
          <div className="bg-indigo-600 h-full" style={{ width: `${delivery.status}%` }} />
        </div>
        <div className="flex items-center gap-4">
          <p className={cn(
            "text-xs font-bold flex items-center gap-1.5",
            missingDocs > 0 ? "text-amber-600" : "text-emerald-600"
          )}>
            <FileText size={14} />
            {missingDocs > 0 ? `${missingDocs} doc(s) ontbreken` : "Documenten compleet"}
          </p>
          {delivery.delayRisk && delivery.delayRisk !== 'low' && (
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
              delivery.delayRisk === 'high' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
            )}>
              <AlertCircle size={12} />
              {delivery.delayRisk} Risk: {delivery.predictionReason}
            </div>
          )}
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock size={14} />
            ETA: {delivery.eta || 'TBD'}
          </p>
        </div>
      </div>
      <ChevronRight className="text-slate-300" />
    </motion.div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="bg-white p-10 rounded-[2rem] border border-dashed border-slate-300 text-center">
    <p className="text-slate-400 text-sm">{message}</p>
  </div>
);

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Dashboard;
