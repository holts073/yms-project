import { useSocket } from '../SocketContext';

export const useAuditLogs = () => {
  const { state } = useSocket();
  const logs = state?.logs || [];

  // Sort logs by timestamp descending (newest first)
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    logs: sortedLogs,
    isLoading: !state
  };
};
