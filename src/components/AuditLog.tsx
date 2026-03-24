import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { 
  History, 
  User as UserIcon, 
  Calendar, 
  Info,
  ArrowRight,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const AuditLog = ({ onNavigate }: { onNavigate?: (tab: string, reference?: string) => void }) => {
  const { state } = useSocket();
  const { logs = [] } = state || {};
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => {
    const searchStr = `${log.timestamp} ${log.user} ${log.action} ${log.details} ${log.reference || ''}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Audit Log</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Een volledig overzicht van alle wijzigingen en acties binnen het systeem.</p>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Zoek op tijd, gebruiker, actie, ref..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-colors"
          />
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-10 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tijdstip</th>
                <th className="px-10 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gebruiker</th>
                <th className="px-10 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actie</th>
                <th className="px-10 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Referentie</th>
                <th className="px-10 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                      <span className="text-sm font-medium">
                        {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm', { locale: nl })}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                        <UserIcon size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                      log.action.includes('Created') || log.action.includes('Added') ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                      log.action.includes('Deleted') ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    {log.reference ? (
                      <div className="flex flex-col text-left">
                        <button 
                          onClick={() => onNavigate?.('deliveries', log.reference)}
                          className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-all text-left"
                        >
                          {log.reference}
                        </button>
                        {(() => {
                          const delivery = state?.deliveries?.find(d => d.reference === log.reference);
                          const supplier = state?.addressBook?.suppliers?.find(s => s.id === delivery?.supplierId);
                          return supplier?.otif ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              OTIF: {supplier.otif}%
                            </span>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <span className="text-sm font-medium">{log.details}</span>
                      <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-slate-50 text-slate-300 rounded-full">
                        <History size={48} />
                      </div>
                      <p className="text-slate-400 font-medium">Geen logs gevonden die voldoen aan de zoekterm.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default AuditLog;
