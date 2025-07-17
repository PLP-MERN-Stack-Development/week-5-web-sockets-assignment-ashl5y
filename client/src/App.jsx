import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import './App.css';

function App() {
  const [username, setUsername] = useLocalStorage('chat-username', '');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (username) {
      setIsLoggedIn(true);
    }
  }, [username]);

  const handleLogin = (newUsername) => {
    setUsername(newUsername);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUsername('');
    setIsLoggedIn(false);
  };

  return (
    <div className="App">
      <Router>
        <NotificationProvider>
          <SocketProvider username={username}>
            <Routes>
              <Route
                path="/login"
                element={
                  isLoggedIn ? (
                    <Navigate to="/chat" replace />
                  ) : (
                    <LoginPage onLogin={handleLogin} />
                  )
                }
              />
              <Route
                path="/chat"
                element={
                  isLoggedIn ? (
                    <ChatPage username={username} onLogout={handleLogout} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/"
                element={
                  <Navigate to={isLoggedIn ? "/chat" : "/login"} replace />
                }
              />
            </Routes>
          </SocketProvider>
        </NotificationProvider>
      </Router>
    </div>
  );
}

export default App;