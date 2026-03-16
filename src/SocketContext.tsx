import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppState, User } from './types';

interface SocketContextType {
  socket: Socket | null;
  state: AppState | null;
  currentUser: User;
  dispatch: (type: string, payload: any) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  
  // Mock current user for demo
  const [currentUser] = useState<User>({
    id: 'admin',
    name: 'Admin User',
    role: 'admin',
    email: 'admin@example.com'
  });

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('init', (initialState: AppState) => {
      setState(initialState);
    });

    newSocket.on('state_update', (newState: AppState) => {
      setState(newState);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const dispatch = (type: string, payload: any) => {
    if (socket) {
      socket.emit('action', { type, payload, user: currentUser });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, state, currentUser, dispatch }}>
      {children}
    </SocketContext.Provider>
  );
};
