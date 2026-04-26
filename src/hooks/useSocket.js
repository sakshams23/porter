import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

let socketInstance = null;

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (!socketInstance) {
      socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket'],
      });
    }
    socketRef.current = socketInstance;
    socketInstance.emit('join', { userId: user._id, role: user.role });

    return () => {};
  }, [user]);

  return socketRef.current;
}

export function getSocket() { return socketInstance; }
