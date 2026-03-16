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
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from '../types';

const UserManagement = () => {
  const { state, dispatch, currentUser } = useSocket();
  const { users = [] } = state || {};
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff' as UserRole
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch('ADD_USER', {
      id: Math.random().toString(36).substr(2, 9),
      ...formData
    });
    setIsModalOpen(false);
    setFormData({ name: '', email: '', role: 'staff' });
  };

  const updateRole = (user: User, newRole: UserRole) => {
    dispatch('UPDATE_USER', { ...user, role: newRole });
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
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Gebruikersbeheer</h2>
          <p className="text-slate-500 mt-1">Beheer rollen en toegangsrechten voor het team.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          Nieuwe Gebruiker
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-10 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Gebruiker</th>
              <th className="px-10 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</th>
              <th className="px-10 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
              <th className="px-10 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                      <UserIcon size={20} />
                    </div>
                    <span className="font-bold text-slate-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-10 py-6 text-slate-500 text-sm font-medium">{user.email}</td>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <span className="text-sm font-bold text-slate-700 capitalize">{user.role}</span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <select 
                    value={user.role}
                    onChange={(e) => updateRole(user, e.target.value as UserRole)}
                    disabled={user.id === currentUser.id}
                    className="bg-slate-100 border-none rounded-full px-4 py-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              <form onSubmit={handleAddUser} className="p-6 sm:p-10 space-y-6 sm:space-y-8 overflow-y-auto flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Nieuwe Gebruiker</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X size={24} />
                  </button>
                </div>

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
                    <label className="text-sm font-bold text-slate-700 ml-4">Rol</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                  Gebruiker Toevoegen
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
