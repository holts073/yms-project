import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { 
  User as UserIcon, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Eye,
  Plus,
  X,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from '../types';

// Utility for conditional class names
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const UserManagement = ({ embedded = false }: { embedded?: boolean }) => {
  const { state, dispatch, currentUser } = useSocket();
  const { users = [] } = state || {};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
    permissions: {} as any
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      dispatch('UPDATE_USER', {
        id: editingUserId,
        ...formData
      });
      setFeedback({ type: 'success', message: 'Gebruiker aangepast' });
    } else {
      dispatch('ADD_USER', {
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      });
      setFeedback({ type: 'success', message: 'Gebruiker toegevoegd (als e-mail uniek is)' });
    }
    
    setTimeout(() => {
      setIsModalOpen(false);
      setEditingUserId(null);
      setFormData({ name: '', email: '', role: 'staff', password: '', permissions: {} });
      setFeedback(null);
    }, 2000);
  };

  const openEditModal = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      permissions: user.permissions || {}
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingUserId(null);
    setFormData({ name: '', email: '', password: '', role: 'staff', permissions: {} });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const updateRole = (user: User, newRole: UserRole) => {
    dispatch('UPDATE_USER', { ...user, role: newRole });
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Weet u zeker dat u deze gebruiker wilt verwijderen?')) {
      dispatch('DELETE_USER', id);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <ShieldAlert size={18} className="text-red-600" />;
      case 'manager': return <ShieldCheck size={18} className="text-indigo-600" />;
      case 'staff': return <Shield size={18} className="text-emerald-600" />;
      case 'viewer': return <Eye size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className={embedded ? "space-y-6" : "space-y-10"}>
      {!embedded && (
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Gebruikersbeheer</h2>
            <p className="text-slate-500 mt-1">Beheer rollen en toegangsrechten voor het team.</p>
          </div>
          <button 
            onClick={openNewModal}
            className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            Nieuwe Gebruiker
          </button>
        </header>
      )}

      {embedded && (
        <div className="flex justify-end mb-4">
          <button 
            onClick={openNewModal}
            className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-3 shadow-md hover:bg-indigo-700 transition-all active:scale-95 text-sm"
          >
            <Plus size={16} />
            Nieuwe Gebruiker
          </button>
        </div>
      )}

      <div className={cn("bg-white rounded-[2.5rem] overflow-hidden", embedded ? "border border-slate-100" : "border border-slate-200 shadow-sm")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Gebruiker</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                        <UserIcon size={20} />
                      </div>
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-medium truncate max-w-[200px]">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className="text-sm font-bold text-slate-700 capitalize">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select 
                        value={user.role}
                        onChange={(e) => updateRole(user, e.target.value as UserRole)}
                        disabled={user.id === currentUser?.id}
                        className="bg-slate-100 border-none rounded-full px-4 py-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      {user.id !== currentUser?.id && (
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors text-xs font-bold"
                        >
                          Rechten / Edit
                        </button>
                      )}
                      {user.id !== currentUser?.id && currentUser?.role === 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
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

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !feedback && setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              <form onSubmit={handleSaveUser} className="p-6 sm:p-10 space-y-6 sm:space-y-8 overflow-y-auto flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">{editingUserId ? 'Gebruiker Aanpassen' : 'Nieuwe Gebruiker'}</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                {feedback ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4",
                      feedback.type === 'success' ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                    )}
                  >
                    {feedback.type === 'success' ? <CheckCircle2 size={48} className="text-emerald-500" /> : <AlertCircle size={48} className="text-red-500" />}
                    <p className="font-bold text-lg">{feedback.message}</p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Naam</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">E-mail</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">
                      {editingUserId ? 'Wachtwoord (leeg laten om te behouden)' : 'Wachtwoord'}
                    </label>
                    <input 
                      required={!editingUserId}
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Rol</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="admin">Admin (Alle rechten)</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                      <option value="viewer">Viewer (Alleen lezen)</option>
                    </select>
                  </div>

                  {formData.role !== 'admin' && formData.role !== 'viewer' && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 ml-4">Specifieke Rechten</h4>
                      <div className="space-y-3 bg-slate-50 p-6 rounded-3xl">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.permissions?.manageDeliveries || false}
                            onChange={e => setFormData({ ...formData, permissions: { ...formData.permissions, manageDeliveries: e.target.checked } })}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm font-bold text-slate-700">Leveringen Beheren (Aanmaken/Bewerken)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.permissions?.sendTransportOrder || false}
                            onChange={e => setFormData({ ...formData, permissions: { ...formData.permissions, sendTransportOrder: e.target.checked } })}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm font-bold text-slate-700">Mail Transport Order versturen</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.permissions?.manageAddressBook || false}
                            onChange={e => setFormData({ ...formData, permissions: { ...formData.permissions, manageAddressBook: e.target.checked } })}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm font-bold text-slate-700">Adressenboek Beheren</span>
                        </label>
                      </div>
                    </div>
                  )}
                  </div>
                )}

                <div className="pt-4">
                  <button disabled={!!feedback} type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {editingUserId ? 'Opslaan' : 'Gebruiker Toevoegen'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
