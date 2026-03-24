import React, { useState, useMemo } from 'react';
import { Plus, Search, BookUser } from 'lucide-react';
import { useAddressBook } from '../hooks/useAddressBook';
import { Button } from './shared/Button';
import { AddressTable } from './features/AddressTable';
import { AddressModal } from './features/AddressModal';
import { AddressEntry } from '../types';
import { cn } from '../lib/utils';

const AddressBook = () => {
  const { suppliers, transporters, actions } = useAddressBook();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'transporters'>('suppliers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<AddressEntry> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const currentEntries = useMemo(() => {
    const list = activeTab === 'suppliers' ? suppliers : transporters;
    return list
      .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  e.contact.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeTab, suppliers, transporters, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry?.id) {
      actions.updateAddress(activeTab, editingEntry as AddressEntry);
    } else {
      actions.addAddress(activeTab, editingEntry!);
    }
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
            <BookUser className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tight italic uppercase">Adressenboek</h2>
            <p className="text-[var(--muted-foreground)] mt-1 font-medium tracking-widest uppercase text-xs">Beheer contactgegevens van leveranciers en transporteurs.</p>
          </div>
        </div>
        <Button onClick={() => { setEditingEntry({}); setIsModalOpen(true); }} leftIcon={<Plus size={20} />}>
          Nieuw Contact
        </Button>
      </header>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-2 p-1.5 bg-card rounded-3xl border border-border w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={cn(
              "px-8 py-3 rounded-2xl font-bold transition-all",
              activeTab === 'suppliers' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50"
            )}
          >
            Leveranciers
          </button>
          <button
            onClick={() => setActiveTab('transporters')}
            className={cn(
              "px-8 py-3 rounded-2xl font-bold transition-all",
              activeTab === 'transporters' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50"
            )}
          >
            Transporteurs
          </button>
        </div>

        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
          <input 
            type="text" 
            placeholder={`Zoek in ${activeTab === 'suppliers' ? 'leveranciers' : 'transporteurs'}...`} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm text-foreground outline-none"
          />
        </div>
      </div>

      <AddressTable 
        entries={currentEntries}
        onEdit={(e) => { setEditingEntry(e); setIsModalOpen(true); }}
        onDelete={(id) => actions.deleteAddress(activeTab, id)}
      />

      <AddressModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entry={editingEntry}
        onUpdateEditing={setEditingEntry}
        onSave={handleSubmit}
        category={activeTab}
      />
    </div>
  );
};

export default AddressBook;
