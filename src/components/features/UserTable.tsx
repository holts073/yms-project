import React from 'react';
import { User as UserIcon, Shield, ShieldAlert, ShieldCheck, Eye, Trash2, KeyRound } from 'lucide-react';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { User, UserRole } from '../../types';
import { cn } from '../../lib/utils';

interface UserTableProps {
  users: User[];
  currentUser: User | null;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onUpdateRole: (user: User, role: UserRole) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  currentUser,
  onEdit,
  onDelete,
  onUpdateRole
}) => {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <ShieldAlert size={18} className="text-rose-600" />;
      case 'manager': return <ShieldCheck size={18} className="text-indigo-600" />;
      case 'staff': return <Shield size={18} className="text-emerald-600" />;
      case 'gate_guard': return <Shield size={18} className="text-amber-500" />;
      case 'finance_auditor': return <Shield size={18} className="text-rose-400" />;
      case 'viewer': return <Eye size={18} className="text-[var(--muted-foreground)]" />;
      default: return <Shield size={18} className="text-emerald-600" />;
    }
  };

  return (
    <div className="bg-card rounded-[2rem] overflow-hidden border border-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-[var(--muted)]/50 border-b border-border">
              <th className="px-6 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Gebruiker</th>
              <th className="px-6 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">E-mail</th>
              <th className="px-6 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Rol</th>
              <th className="px-6 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-right">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[var(--muted)]/40 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--muted)] rounded-full flex items-center justify-center text-[var(--muted-foreground)] shrink-0">
                      <UserIcon size={20} />
                    </div>
                    <span className="font-bold text-foreground">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[var(--muted-foreground)] text-sm font-medium">{user.email}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <span className="text-sm font-bold text-foreground capitalize">{user.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <select 
                      value={user.role}
                      onChange={(e) => onUpdateRole(user, e.target.value as UserRole)}
                      disabled={user.id === currentUser?.id}
                      className="bg-[var(--muted)] border border-border rounded-full px-4 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-slate-700 dark:text-white outline-none"
                    >
                      <option value="admin" className="bg-white dark:bg-slate-800">Admin</option>
                      <option value="manager" className="bg-white dark:bg-slate-800">Manager</option>
                      <option value="staff" className="bg-white dark:bg-slate-800">Staff</option>
                      <option value="gate_guard" className="bg-white dark:bg-slate-800">Poortwachter</option>
                      <option value="finance_auditor" className="bg-white dark:bg-slate-800">Finance</option>
                      <option value="operator" className="bg-white dark:bg-slate-800">Operator</option>
                      <option value="lead_operator" className="bg-white dark:bg-slate-800">Lead Operator</option>
                      <option value="viewer" className="bg-white dark:bg-slate-800">Viewer</option>
                    </select>
                    
                    {user.twoFactorEnabled && currentUser?.role === 'admin' && (
                      <button 
                        onClick={async () => {
                          if (confirm(`Weet u zeker dat u de 2FA voor ${user.name} wilt resetten?`)) {
                            try {
                              const res = await fetch('/api/admin/reset-2fa', {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({ userId: user.id })
                              });
                              if (res.ok) alert('2FA succesvol gereset');
                              else alert('Fout bij resetten');
                            } catch (e) {
                              alert('Netwerkfout');
                            }
                          }
                        }}
                        title="Reset 2FA"
                        className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full transition-all"
                      >
                        <KeyRound size={16} />
                      </button>
                    )}
                    
                    {user.id !== currentUser?.id && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(user)} className="text-xs">
                        Bewerken
                      </Button>
                    )}
                    
                    {user.id !== currentUser?.id && currentUser?.role === 'admin' && (
                      <button 
                        onClick={() => onDelete(user.id)}
                        className="p-2 text-[var(--muted-foreground)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
