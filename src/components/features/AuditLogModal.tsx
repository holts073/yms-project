import * as React from 'react';
import { Modal } from '../shared/Modal';
import { Badge } from '../shared/Badge';
import { Clock, User as UserIcon, Activity } from 'lucide-react';
import { Delivery } from '../../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, delivery }) => {
  if (!delivery) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Logboek: ${delivery.reference}`} maxWidth="2xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Systeem ID</p>
              <p className="text-sm font-mono font-bold text-foreground">#{delivery.id.toUpperCase()}</p>
            </div>
          </div>
          <Badge variant={delivery.status === 100 ? 'success' : 'warning'}>
            Status: {delivery.status}%
          </Badge>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {(!delivery.auditTrail || delivery.auditTrail.length === 0) ? (
            <div className="text-center py-10 text-[var(--muted-foreground)] italic">
              Geen logboekvermeldingen gevonden voor deze zending.
            </div>
          ) : (
            delivery.auditTrail.map((entry, idx) => (
              <div key={idx} className="relative pl-8 pb-6 border-l-2 border-border last:pb-0">
                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-card border-2 border-indigo-500" />
                <div className="bg-[var(--muted)]/30 rounded-2xl p-4 border border-border/50 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <UserIcon size={14} />
                      <span className="text-xs font-black uppercase tracking-tight">{entry.user}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold">{new Date(entry.timestamp).toLocaleString('nl-NL')}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1">{entry.action}</p>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed italic">{entry.details}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
          >
            Sluiten
          </button>
        </div>
      </div>
    </Modal>
  );
};
