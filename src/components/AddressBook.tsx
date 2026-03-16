import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  User as UserIcon,
  X,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AddressEntry } from '../types';

const AddressBook = () => {
  const { state, dispatch } = useSocket();
  const { addressBook } = state || {};
  const [activeTab, setActiveTab] = useState<'suppliers' | 'transporters'>('suppliers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AddressEntry | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
  });

  const handleOpenModal = (entry?: AddressEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        name: entry.name,
        contact: entry.contact,
        email: entry.email,
        address: entry.address,
      });
    } else {
      setEditingEntry(null);
      setFormData({
        name: '',
        contact: '',
        email: '',
        address: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      dispatch('UPDATE_ADDRESS', {
        category: activeTab,
        entry: { ...editingEntry, ...formData }
      });
    } else {
      dispatch('ADD_ADDRESS', {
        category: activeTab,
        entry: {
          id: Math.random().toString(36).substr(2, 9),
          ...formData,
          type: activeTab === 'suppliers' ? 'supplier' : 'transporter'
        }
      });
    }
    setIsModalOpen(false);
  };

  const entries = addressBook?.[activeTab] || [];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Adressenboek</h2>
          <p className="text-slate-500 mt-1">Beheer contactgegevens van leveranciers en transporteurs.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          Nieuw Contact
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 p-2 bg-white rounded-full border border-slate-200 w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={cn(
            "px-8 py-3 rounded-full font-bold transition-all",
            activeTab === 'suppliers' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          Leveranciers
        </button>
        <button
          onClick={() => setActiveTab('transporters')}
          className={cn(
            "px-8 py-3 rounded-full font-bold transition-all",
            activeTab === 'transporters' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          Transporteurs / Expediteurs
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder={`Zoek in ${activeTab === 'suppliers' ? 'leveranciers' : 'transporteurs'}...`} 
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* List View */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-200">
              <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bedrijf</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Adres</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <Building2 size={16} />
                    </div>
                    <span className="font-bold text-slate-900">{entry.name}</span>
                  </div>
                </td>
                <td className="px-8 py-4 text-sm text-slate-600">{entry.contact}</td>
                <td className="px-8 py-4 text-sm text-slate-600">{entry.email}</td>
                <td className="px-8 py-4 text-sm text-slate-600 truncate max-w-xs">{entry.address}</td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(entry)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => dispatch('DELETE_ADDRESS', { category: activeTab, id: entry.id })}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">
                  Geen contacten gevonden in deze categorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
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
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {editingEntry ? 'Contact Aanpassen' : 'Nieuw Contact'}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Bedrijfsnaam</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Contactpersoon</label>
                    <input 
                      required
                      type="text" 
                      value={formData.contact}
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">E-mailadres</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Adres</label>
                    <textarea 
                      required
                      rows={3}
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-full font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Annuleren
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                  >
                    {editingEntry ? 'Opslaan' : 'Toevoegen'}
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default AddressBook;
