import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, username }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (username) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('user_join', username);
      });

      newSocket.on('disconnect', () => setIsConnected(false));
      newSocket.on('receive_message', (message) => {
        setMessages(prev => [...prev, message]);
      });
      newSocket.on('user_list', setUsers);
      newSocket.on('typing_users', setTypingUsers);

      return () => newSocket.close();
    }
  }, [username]);

  const sendMessage = (message) => {
    if (socket && message.trim()) {
      socket.emit('send_message', { message });
    }
  };

  const sendPrivateMessage = (to, message) => {
    if (socket && message.trim()) {
      socket.emit('private_message', { to, message });
    }
  };

  const setTyping = (isTyping) => {
    if (socket) {
      socket.emit('typing', isTyping);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      messages,
      users,
      typingUsers,
      sendMessage,
      sendPrivateMessage,
      setTyping
    }}>
      {children}
    </SocketContext.Provider>
  );
};