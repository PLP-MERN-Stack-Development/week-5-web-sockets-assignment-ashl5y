import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim() && username.length >= 2) {
      setIsLoading(true);
      await onLogin(username.trim());
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="mb-4">
          <MessageCircle size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 16px' }} />
        </div>
        <h1 className="login-title">Welcome to Chat</h1>
        <p className="login-subtitle">Enter your username to start chatting</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="login-input"
            minLength={2}
            maxLength={50}
            required
          />
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading || username.length < 2}
          >
            {isLoading ? <div className="loading" /> : 'Join Chat'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
