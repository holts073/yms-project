import { useSocket } from '../SocketContext';
import { AddressEntry } from '../types';

export const useAddressBook = () => {
  const { state, dispatch } = useSocket();
  const addressBook = state?.addressBook || { suppliers: [], transporters: [], customers: [] };

  const addAddress = (category: 'suppliers' | 'transporters' | 'customers', entry: Partial<AddressEntry>) => {
    dispatch('ADD_ADDRESS', {
      category,
      entry: {
        id: Math.random().toString(36).substr(2, 9),
        ...entry,
        type: category === 'suppliers' ? 'supplier' : category === 'transporters' ? 'transporter' : 'customer'
      }
    });
  };

  const updateAddress = (category: 'suppliers' | 'transporters' | 'customers', entry: AddressEntry) => {
    dispatch('UPDATE_ADDRESS', { category, entry });
  };

  const deleteAddress = (category: 'suppliers' | 'transporters' | 'customers', id: string) => {
    dispatch('DELETE_ADDRESS', { category, id });
  };

  return {
    suppliers: addressBook.suppliers || [],
    transporters: addressBook.transporters || [],
    customers: addressBook.customers || [],
    actions: {
      addAddress,
      updateAddress,
      deleteAddress
    }
  };
};
