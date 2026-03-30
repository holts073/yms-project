import React, { useMemo } from 'react';
import { History, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PalletTransaction, AddressEntry } from '../../types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface PalletLedgerProps {
  transactions: PalletTransaction[];
  entity: AddressEntry | null;
  compact?: boolean;
}

export const PalletLedger: React.FC<PalletLedgerProps> = ({ transactions, entity, compact }) => {
  const balance = useMemo(() => {
    return transactions.reduce((acc, t) => acc + t.balanceChange, 0);
  }, [transactions]);

  const totalValue = useMemo(() => {
    if (!entity?.pallet_rate) return 0;
    return balance * entity.pallet_rate;
  }, [balance, entity]);

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card/50 rounded-3xl border border-dashed border-border transition-all">
        <History size={48} className="text-[var(--muted-foreground)] mb-4 opacity-20" />
        <h3 className="text-lg font-bold text-foreground italic uppercase tracking-widest">Geen entiteit geselecteerd</h3>
        <p className="text-[var(--muted-foreground)] max-w-xs mt-2 font-medium uppercase text-[10px] tracking-tighter">Selecteer een leverancier of transporteur om de transactiegeschiedenis te bekijken.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className={cn("grid gap-4", compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600/10 p-3 rounded-2xl group-hover:bg-indigo-600 transition-all">
              <History size={24} className="text-indigo-600 group-hover:text-white transition-all" />
            </div>
            <div>
              <p className="text-[var(--muted-foreground)] text-[10px] font-black uppercase tracking-widest mb-0.5">Actueel Saldo</p>
              <h4 className={cn("text-2xl font-black italic tracking-tighter", balance >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {balance > 0 ? `+${balance}` : balance} Pallets
              </h4>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600/10 p-3 rounded-2xl group-hover:bg-emerald-600 transition-all">
              <Wallet size={24} className="text-emerald-600 group-hover:text-white transition-all" />
            </div>
            <div>
              <p className="text-[var(--muted-foreground)] text-[10px] font-black uppercase tracking-widest mb-0.5">Geraamde Waarde</p>
              <h4 className="text-2xl font-black italic text-foreground tracking-tighter">
                € {totalValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-amber-600/10 p-3 rounded-2xl group-hover:bg-amber-600 transition-all">
              <TrendingUp size={24} className="text-amber-600 group-hover:text-white transition-all" />
            </div>
            <div>
              <p className="text-[var(--muted-foreground)] text-[10px] font-black uppercase tracking-widest mb-0.5">Pallet Tarief</p>
              <h4 className="text-2xl font-black italic text-foreground tracking-tighter italic">
                € {(entity.pallet_rate || 0).toFixed(2)} / pallet
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
          <h3 className="font-black italic uppercase tracking-widest text-xs text-foreground">Transactiegeschiedenis</h3>
          <span className="text-[var(--muted-foreground)] text-[10px] font-bold uppercase">{transactions.length} mutaties</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/10 border-b border-border">
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-500/70">Datum</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-500/70">Referentie</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-500/70">Status</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-500/70 text-right">Mutatie</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-500/70 text-right">Financieel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--muted-foreground)] text-xs font-medium uppercase italic tracking-tighter opacity-50">
                    Nog geen transacties geregistreerd voor deze entiteit.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-foreground tracking-tighter italic uppercase">
                      {format(new Date(t.createdAt), 'dd MMM yyyy HH:mm', { locale: nl })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-foreground tracking-tight underline decoration-indigo-500/30">DEL-{t.deliveryId}</span>
                        <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-widest opacity-60">Levering Koppeling</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest block w-fit shadow-sm",
                         t.balanceChange > 0 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                       )}>
                         {t.balanceChange > 0 ? 'Inkomend' : 'Uitgaand'}
                       </span>
                    </td>
                    <td className={cn("px-6 py-4 text-sm font-black italic text-right tracking-tighter", t.balanceChange >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {t.balanceChange > 0 ? `+${t.balanceChange}` : t.balanceChange}
                    </td>
                    <td className="px-6 py-4 text-sm font-black italic text-right text-foreground tracking-widest">
                      € {(t.balanceChange * (entity.pallet_rate || 0)).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
