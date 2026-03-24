import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { Button } from './shared/Button';
import { UserTable } from './features/UserTable';
import { UserModal } from './features/UserModal';
import { User, UserRole } from '../types';

const UserManagement = ({ embedded = false }: { embedded?: boolean }) => {
  const { users, currentUser, actions } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser?.id) {
      actions.updateUser(editingUser as User);
      setFeedback({ type: 'success', message: 'Gebruiker aangepast' });
    } else {
      actions.addUser(editingUser!);
      setFeedback({ type: 'success', message: 'Gebruiker toegevoegd' });
    }
    
    setTimeout(() => {
      setIsModalOpen(false);
      setEditingUser(null);
      setFeedback(null);
    }, 1500);
  };

  const openNewModal = () => {
    setEditingUser({ role: 'staff', permissions: {} });
    setIsModalOpen(true);
  };

  return (
    <div className={embedded ? "space-y-6" : "space-y-10"}>
      {!embedded && (
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tight">Gebruikersbeheer</h2>
            <p className="text-[var(--muted-foreground)] mt-1 font-medium">Beheer rollen en toegangsrechten voor het team.</p>
          </div>
          <Button onClick={openNewModal} leftIcon={<Plus size={20} />}>
            Nieuwe Gebruiker
          </Button>
        </header>
      )}

      {embedded && (
        <div className="flex justify-end mb-4">
          <Button onClick={openNewModal} size="sm" leftIcon={<Plus size={16} />}>
            Nieuwe Gebruiker
          </Button>
        </div>
      )}

      <UserTable 
        users={users}
        currentUser={currentUser}
        onEdit={(u) => { setEditingUser(u); setIsModalOpen(true); }}
        onDelete={actions.deleteUser}
        onUpdateRole={(u, role) => actions.updateUser({ ...u, role })}
      />

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        onSave={handleSaveUser}
        onUpdateEditing={setEditingUser}
        feedback={feedback}
      />
    </div>
  );
};

export default UserManagement;
