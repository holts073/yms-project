import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppState, User } from './types';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  state: AppState | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check local storage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setCurrentUser(JSON.parse(userStr));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    const newSocket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true // Ensure fresh session on every init
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      toast.success('Verbonden met centrale server', { id: 'socket-status' });
    });

    newSocket.on('disconnect', () => {
      console.warn('Socket disconnected');
      toast.error('Verbinding met server verloren', { id: 'socket-status' });
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      toast.error(`Verbindingsfout: ${err.message}`, { id: 'socket-status' });
      if (err.message.includes('Authentication error') || err.message.includes('Invalid token')) {
        logout();
      }
    });

    newSocket.on('init', (initialState: AppState) => {
      setState(initialState);
    });

    newSocket.on('state_update', (newState: AppState) => {
      setState(newState);
    });

    newSocket.on('state_patch', (patch: { type: string, payload: any }) => {
      setState(prevState => {
        if (!prevState) return null;
        
        const newState = { ...prevState };
        switch (patch.type) {
          case 'DELIVERY_ADDED':
            // Prevent duplicates if already present
            if (newState.deliveries.some(d => d.id === patch.payload.id)) return prevState;
            newState.deliveries = [patch.payload, ...newState.deliveries];
            break;
          case 'DELIVERY_UPDATED':
            newState.deliveries = newState.deliveries.map(d => 
              d.id === patch.payload.id ? { ...d, ...patch.payload } : d
            );
            break;
          case 'YMS_DELIVERY_UPDATED':
            if (!newState.yms.deliveries.some(d => d.id === patch.payload.id)) {
              newState.yms.deliveries = [patch.payload, ...newState.yms.deliveries];
            } else {
              newState.yms.deliveries = newState.yms.deliveries.map(d => 
                d.id === patch.payload.id ? { ...d, ...patch.payload } : d
              );
            }
            break;
          case 'DELIVERY_DELETED':
            newState.deliveries = newState.deliveries.filter(d => d.id !== patch.payload);
            newState.yms.deliveries = newState.yms.deliveries.filter(d => d.mainDeliveryId !== patch.payload);
            break;
          case 'ADDRESS_UPDATED':
            const entry = patch.payload;
            const category = entry.type === 'supplier' ? 'suppliers' : (entry.type === 'transporter' ? 'transporters' : 'customers');
            newState.addressBook[category] = newState.addressBook[category].map(a => 
              a.id === entry.id ? entry : a
            );
            // If new, push it (though ADDRESS_ADDED could be separate, let's merge)
            if (!newState.addressBook[category].some(a => a.id === entry.id)) {
              newState.addressBook[category].push(entry);
            }
            break;
        }
        return newState;
      });
    });

    newSocket.on('notification', (data: { message: string, type: 'info' | 'success' | 'warning' | 'error' }) => {
      const { message, type } = data;
      if (type === 'success') toast.success(message);
      else if (type === 'warning') toast.warning(message, { duration: 5000 });
      else if (type === 'error') toast.error(message, { duration: 6000 });
      else toast.info(message);
    });

    newSocket.on('error_message', (msg: string) => {
      toast.error(msg, {
        duration: 5000,
        position: 'top-right'
      });
    });

    // Activity timeout logic (60 minutes) - Disabled for Tablet role
    let inactivityTimer: NodeJS.Timeout;
    const resetTimer = () => {
      if (currentUser?.role === 'tablet') return;
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logout();
      }, 60 * 60 * 1000);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => document.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(evt => document.removeEventListener(evt, resetTimer));
      newSocket.close();
    };
  }, [isAuthenticated]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setState(null);
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  const dispatch = (type: string, payload: any) => {
    if (socket && isAuthenticated) {
      socket.emit('action', { type, payload });
    }
  };

  // State Reconciliation (Heartbeat)
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit('REQUEST_SYNC');
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(heartbeat);
  }, [socket, isAuthenticated]);

  // Global event listener for dispatching actions from deep components
  useEffect(() => {
    const handleAction = (e: any) => {
      const { type, payload } = e.detail;
      dispatch(type, payload);
    };
    window.addEventListener('YMS_ACTION', handleAction);
    (window as any).YMS_READY = true;
    return () => {
      window.removeEventListener('YMS_ACTION', handleAction);
      (window as any).YMS_READY = false;
    };
  }, [socket, isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, state, currentUser, isAuthenticated, login, logout, dispatch }}>
      {children}
    </SocketContext.Provider>
  );
};
