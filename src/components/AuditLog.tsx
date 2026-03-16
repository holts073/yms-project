import React from 'react';
import { useSocket } from '../SocketContext';
import { 
  History, 
  User as UserIcon, 
  Calendar, 
  Info,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const AuditLog = () => {
  const { state } = useSocket();
  const { logs = [] } = state || {};

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Audit Log</h2>
        <p className="text-slate-500 mt-1">Een volledig overzicht van alle wijzigingen en acties binnen het systeem.</p>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-10 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tijdstip</th>
                <th className="px-10 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Gebruiker</th>
                <th className="px-10 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Actie</th>
                <th className="px-10 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Calendar size={16} className="text-slate-400" />
                      <span className="text-sm font-medium">
                        {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm', { locale: nl })}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                        <UserIcon size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                      log.action.includes('Created') || log.action.includes('Added') ? "bg-emerald-50 text-emerald-600" :
                      log.action.includes('Deleted') ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Info size={16} className="text-slate-400 shrink-0" />
                      <span className="text-sm font-medium">{log.details}</span>
                      <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-slate-50 text-slate-300 rounded-full">
                        <History size={48} />
                      </div>
                      <p className="text-slate-400 font-medium">Nog geen activiteiten gelogd.</p>
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
