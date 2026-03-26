import React from 'react';
import { Building2, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../shared/Button';
import { AddressEntry } from '../../types';
import { cn } from '../../lib/utils';

interface AddressTableProps {
  entries: AddressEntry[];
  balances?: Record<string, number>;
  onEdit: (entry: AddressEntry) => void;
  onDelete: (id: string) => void;
}

export const AddressTable: React.FC<AddressTableProps> = ({
  entries,
  balances = {},
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[var(--muted)]/50 border-b border-border">
            <th className="px-8 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Bedrijf</th>
            <th className="px-8 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Contact</th>
            <th className="px-8 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">E-mail</th>
            <th className="px-8 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Adres</th>
            <th className="px-8 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Pallet Saldo</th>
            <th className="px-8 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-right">Acties</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-[var(--muted)]/40 transition-colors group">
              <td className="px-8 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/30 dark:group-hover:text-indigo-400 transition-colors">
                    <Building2 size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{entry.name}</span>
                    {entry.supplier_number && (
                      <span className="text-[10px] uppercase tracking-tighter font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded w-fit">
                        Supplier: {entry.supplier_number}
                      </span>
                    )}
                    {entry.customer_number && (
                      <span className="text-[10px] uppercase tracking-tighter font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded w-fit">
                        Customer: {entry.customer_number}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-8 py-4 text-sm text-[var(--muted-foreground)]">{entry.contact}</td>
              <td className="px-8 py-4 text-sm text-[var(--muted-foreground)]">{entry.email}</td>
              <td className="px-8 py-4 text-sm text-[var(--muted-foreground)] truncate max-w-xs">{entry.address}</td>
              <td className="px-8 py-4 text-sm font-bold">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-black",
                  (balances[entry.id] || 0) > 0 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" : 
                  (balances[entry.id] || 0) < 0 ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300" : 
                  "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                )}>
                  {(balances[entry.id] || 0) > 0 ? '+' : ''}{balances[entry.id] || 0} st
                </span>
              </td>
              <td className="px-8 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => onEdit(entry)}
                    className="p-2 text-[var(--muted-foreground)] hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-full transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(entry.id)}
                    className="p-2 text-[var(--muted-foreground)] hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 rounded-full transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={6} className="px-8 py-12 text-center text-[var(--muted-foreground)] italic font-medium">
                Geen contacten gevonden in deze categorie.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
