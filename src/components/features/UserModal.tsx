import React from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { User, UserRole } from '../../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Partial<User> | null;
  onSave: (e: React.FormEvent) => void;
  onUpdateEditing: (u: any) => void;
  feedback: { type: 'success' | 'error', message: string } | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  onUpdateEditing,
  feedback
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user?.id ? 'Gebruiker Aanpassen' : 'Nieuwe Gebruiker'}
      maxWidth="lg"
    >
      {feedback ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-10 rounded-3xl flex flex-col items-center justify-center text-center gap-6 ${
            feedback.type === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-400"
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={64} /> : <AlertCircle size={64} />}
          <p className="font-bold text-xl">{feedback.message}</p>
        </motion.div>
      ) : (
        <form onSubmit={onSave} className="space-y-6 pb-4">
          <Input 
            label="Naam"
            required
            value={user?.name || ''}
            onChange={e => onUpdateEditing({ ...user, name: (e.target as HTMLInputElement).value })}
          />
          <Input 
            label="E-mail"
            required
            type="email"
            value={user?.email || ''}
            onChange={e => onUpdateEditing({ ...user, email: (e.target as HTMLInputElement).value })}
          />
          <Input 
            label={user?.id ? 'Wachtwoord (leeg laten om te behouden)' : 'Wachtwoord'}
            required={!user?.id}
            type="password"
            value={user?.password || ''}
            onChange={e => onUpdateEditing({ ...user, password: (e.target as HTMLInputElement).value })}
          />
          <Input 
            as="select"
            label="Rol"
            value={user?.role || 'staff'}
            onChange={e => onUpdateEditing({ ...user, role: (e.target as HTMLSelectElement).value as UserRole })}
          >
            <option value="admin">Admin (Alle rechten)</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer (Alleen lezen)</option>
          </Input>

          {user?.role !== 'admin' && user?.role !== 'viewer' && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest ml-4">Specifieke Rechten</h4>
              <div className="space-y-4 bg-[var(--muted)]/50 p-6 rounded-3xl border border-border">
                {[
                  { id: 'manageDeliveries', label: 'Leveringen Beheren' },
                  { id: 'sendTransportOrder', label: 'Transport Orders' },
                  { id: 'manageAddressBook', label: 'Adressenboek Beheren' }
                ].map(perm => (
                  <label key={perm.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={user?.permissions?.[perm.id] || false}
                      onChange={e => onUpdateEditing({ 
                        ...user, 
                        permissions: { ...(user?.permissions || {}), [perm.id]: e.target.checked } 
                      })}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-border bg-card"
                    />
                    <span className="text-sm font-bold text-foreground group-hover:text-indigo-600 transition-colors">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button type="submit" className="w-full h-14">
              {user?.id ? 'Opslaan' : 'Gebruiker Toevoegen'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
