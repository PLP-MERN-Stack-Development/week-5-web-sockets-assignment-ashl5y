import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Send, Users, LogOut } from 'lucide-react';

const ChatPage = ({ username, onLogout }) => {
  const { messages, users, typingUsers, sendMessage, setTyping, isConnected } = useSocket();
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
      setIsTyping(false);
      setTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      setTyping(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-header">
          <h1>Chat Room</h1>
          <p>Welcome, {username}!</p>
        </div>
        
        <div className="users-list">
          <h3><Users size={16} /> Online Users ({users.length})</h3>
          <div className="users-list-items">
            {users.map(user => (
              <div key={user.id} className="user-item">
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div className="user-status online">Online</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-2">
          <button onClick={onLogout} className="btn btn-secondary btn-small">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="chat-main">
        <div className="connection-status connected">
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.senderId === username ? 'own' : ''} ${message.system ? 'system' : ''}`}>
              {!message.system && !message.senderId === username && (
                <div className="message-avatar">
                  {message.sender.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="message-content">
                <div className="message-text">{message.message}</div>
                <div className="message-meta">
                  {!message.system && <span>{message.sender}</span>}
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.map(user => user.username).join(', ')} 
            {typingUsers.length === 1 ? ' is' : ' are'} typing
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}

        <div className="chat-input-container">
          <form onSubmit={handleSubmit} className="chat-input-form">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input"
              rows={1}
            />
            <button type="submit" className="chat-send-button" disabled={!inputMessage.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
