class Database {
  constructor() {
    this.users = new Map();
    this.messages = [];
    this.rooms = new Map();
    this.typingUsers = new Map();
    this.privateMessages = new Map();
    this.userSessions = new Map();
  }

  addUser(socketId, userData) {
    this.users.set(socketId, {
      ...userData,
      id: socketId,
      joinedAt: new Date(),
      lastSeen: new Date(),
      isOnline: true
    });
  }

  removeUser(socketId) {
    this.users.delete(socketId);
    this.typingUsers.delete(socketId);
  }

  getUser(socketId) {
    return this.users.get(socketId);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  updateUserStatus(socketId, isOnline) {
    const user = this.users.get(socketId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
    }
  }

  addMessage(message) {
    const messageWithId = {
      ...message,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString()
    };
    
    this.messages.push(messageWithId);
    
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }
    
    return messageWithId;
  }

  getMessages(limit = 50, offset = 0) {
    return this.messages.slice(-(limit + offset), -offset || undefined);
  }

  getMessageById(messageId) {
    return this.messages.find(msg => msg.id === messageId);
  }

  createRoom(roomId, roomData) {
    this.rooms.set(roomId, {
      ...roomData,
      id: roomId,
      users: new Set(),
      messages: [],
      createdAt: new Date()
    });
  }

  joinRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.add(userId);
    }
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.delete(userId);
    }
  }

  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users) : [];
  }

  setTyping(userId, isTyping, roomId = 'global') {
    const key = `${userId}-${roomId}`;
    if (isTyping) {
      this.typingUsers.set(key, {
        userId,
        roomId,
        username: this.getUser(userId)?.username,
        timestamp: Date.now()
      });
    } else {
      this.typingUsers.delete(key);
    }
  }

  getTypingUsers(roomId = 'global') {
    const typingInRoom = [];
    for (const [key, data] of this.typingUsers.entries()) {
      if (data.roomId === roomId) {
        if (Date.now() - data.timestamp > 5000) {
          this.typingUsers.delete(key);
        } else {
          typingInRoom.push(data);
        }
      }
    }
    return typingInRoom;
  }

  addPrivateMessage(fromId, toId, message) {
    const conversationId = [fromId, toId].sort().join('-');
    
    if (!this.privateMessages.has(conversationId)) {
      this.privateMessages.set(conversationId, []);
    }
    
    const privateMessage = {
      id: Date.now() + Math.random(),
      fromId,
      toId,
      message,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    this.privateMessages.get(conversationId).push(privateMessage);
    return privateMessage;
  }

  getPrivateMessages(userId1, userId2) {
    const conversationId = [userId1, userId2].sort().join('-');
    return this.privateMessages.get(conversationId) || [];
  }

  cleanup() {
    const now = Date.now();
    
    for (const [key, data] of this.typingUsers.entries()) {
      if (now - data.timestamp > 10000) {
        this.typingUsers.delete(key);
      }
    }
    
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }
  }
}

module.exports = new Database();
