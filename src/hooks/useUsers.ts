import { useSocket } from '../SocketContext';
import { User } from '../types';

export const useUsers = () => {
  const { state, dispatch, currentUser } = useSocket();
  const { users = [] } = state || {};

  // Actions
  const addUser = (user: Partial<User>) => {
    const id = Math.random().toString(36).substr(2, 9);
    dispatch('ADD_USER', { id, ...user });
  };

  const updateUser = (user: Partial<User> & { id: string }) => {
    dispatch('UPDATE_USER', user);
  };

  const deleteUser = (id: string) => {
    dispatch('DELETE_USER', id);
  };

  return {
    users,
    currentUser,
    isAdmin: currentUser?.role === 'admin',
    isManager: currentUser?.role === 'manager' || currentUser?.role === 'admin',
    actions: {
      addUser,
      updateUser,
      deleteUser
    }
  };
};
