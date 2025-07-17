const db = require('../config/database');
const { validateMessage, sanitizeInput } = require('../utils/validation');
const { generateId } = require('../utils/helpers');

class SocketController {
  constructor(io) {
    this.io = io;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      socket.on('user_join', (username) => {
        this.handleUserJoin(socket, username);
      });

      socket.on('send_message', (messageData) => {
        this.handleSendMessage(socket, messageData);
      });

      socket.on('private_message', (data) => {
        this.handlePrivateMessage(socket, data);
      });

      socket.on('typing', (isTyping) => {
        this.handleTyping(socket, isTyping);
      });

      socket.on('join_room', (roomId) => {
        this.handleJoinRoom(socket, roomId);
      });

      socket.on('leave_room', (roomId) => {
        this.handleLeaveRoom(socket, roomId);
      });

      socket.on('message_reaction', (data) => {
        this.handleMessageReaction(socket, data);
      });

      socket.on('file_upload', (data) => {
        this.handleFileUpload(socket, data);
      });

      socket.on('message_read', (messageId) => {
        this.handleMessageRead(socket, messageId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleUserJoin(socket, username) {
    try {
      const sanitizedUsername = sanitizeInput(username);
      
      if (!sanitizedUsername || sanitizedUsername.length < 2) {
        socket.emit('error', 'Username must be at least 2 characters long');
        return;
      }

      const userData = {
        username: sanitizedUsername,
        id: socket.id,
        joinedAt: new Date(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedUsername)}&background=random`
      };

      db.addUser(socket.id, userData);
      
      socket.join('global');
      
      this.io.emit('user_list', db.getAllUsers());
      this.io.emit('user_joined', userData);
      
      const recentMessages = db.getMessages(20);
      socket.emit('message_history', recentMessages);
      
      console.log(`${sanitizedUsername} joined the chat`);
    } catch (error) {
      console.error('Error in handleUserJoin:', error);
      socket.emit('error', 'Failed to join chat');
    }
  }

  handleSendMessage(socket, messageData) {
    try {
      const user = db.getUser(socket.id);
      if (!user) {
        socket.emit('error', 'User not found');
        return;
      }

      const validation = validateMessage(messageData.message);
      if (!validation.isValid) {
        socket.emit('error', validation.error);
        return;
      }

      const message = db.addMessage({
        message: sanitizeInput(messageData.message),
        sender: user.username,
        senderId: socket.id,
        senderAvatar: user.avatar,
        room: messageData.room || 'global',
        type: messageData.type || 'text'
      });

      this.io.to(messageData.room || 'global').emit('receive_message', message);
      
      db.setTyping(socket.id, false, messageData.room || 'global');
      this.io.to(messageData.room || 'global').emit('typing_users', db.getTypingUsers(messageData.room || 'global'));
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      socket.emit('error', 'Failed to send message');
    }
  }

  handlePrivateMessage(socket, data) {
    try {
      const user = db.getUser(socket.id);
      if (!user) {
        socket.emit('error', 'User not found');
        return;
      }

      const validation = validateMessage(data.message);
      if (!validation.isValid) {
        socket.emit('error', validation.error);
        return;
      }

      const privateMessage = db.addPrivateMessage(
        socket.id,
        data.to,
        sanitizeInput(data.message)
      );

      const messageData = {
        ...privateMessage,
        sender: user.username,
        senderAvatar: user.avatar,
        isPrivate: true
      };

      socket.emit('private_message', messageData);
      socket.to(data.to).emit('private_message', messageData);
      
    } catch (error) {
      console.error('Error in handlePrivateMessage:', error);
      socket.emit('error', 'Failed to send private message');
    }
  }

  handleTyping(socket, isTyping) {
    try {
      const user = db.getUser(socket.id);
      if (!user) return;

      db.setTyping(socket.id, isTyping, 'global');
      
      const typingUsers = db.getTypingUsers('global');
      this.io.emit('typing_users', typingUsers);
      
    } catch (error) {
      console.error('Error in handleTyping:', error);
    }
  }

  handleJoinRoom(socket, roomId) {
    try {
      const user = db.getUser(socket.id);
      if (!user) return;

      socket.join(roomId);
      db.joinRoom(roomId, socket.id);
      
      socket.emit('joined_room', roomId);
      socket.to(roomId).emit('user_joined_room', { user, roomId });
      
    } catch (error) {
      console.error('Error in handleJoinRoom:', error);
    }
  }

  handleLeaveRoom(socket, roomId) {
    try {
      const user = db.getUser(socket.id);
      if (!user) return;

      socket.leave(roomId);
      db.leaveRoom(roomId, socket.id);
      
      socket.emit('left_room', roomId);
      socket.to(roomId).emit('user_left_room', { user, roomId });
      
    } catch (error) {
      console.error('Error in handleLeaveRoom:', error);
    }
  }

  handleMessageReaction(socket, data) {
    try {
      const user = db.getUser(socket.id);
      if (!user) return;

      const { messageId, reaction } = data;
      
      const reactionData = {
        messageId,
        reaction,
        userId: socket.id,
        username: user.username,
        timestamp: new Date().toISOString()
      };

      this.io.emit('message_reaction', reactionData);
      
    } catch (error) {
      console.error('Error in handleMessageReaction:', error);
    }
  }

  handleFileUpload(socket, data) {
    try {
      const user = db.getUser(socket.id);
      if (!user) return;

      if (!data.fileName || !data.fileType || !data.fileSize) {
        socket.emit('error', 'Invalid file data');
        return;
      }

      if (data.fileSize > 10 * 1024 * 1024) {
        socket.emit('error', 'File too large');
        return;
      }

      const message = db.addMessage({
        message: `Shared a file: ${data.fileName}`,
        sender: user.username,
        senderId: socket.id,
        senderAvatar: user.avatar,
        room: 'global',
        type: 'file',
        fileData: {
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          fileUrl: data.fileUrl || null
        }
      });

      this.io.emit('receive_message', message);
      
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      socket.emit('error', 'Failed to upload file');
    }
  }

  handleMessageRead(socket, messageId) {
    try {
      const user = db.getUser(socket.id);
      if (!user) return;

      const readData = {
        messageId,
        userId: socket.id,
        username: user.username,
        timestamp: new Date().toISOString()
      };

      this.io.emit('message_read', readData);
      
    } catch (error) {
      console.error('Error in handleMessageRead:', error);
    }
  }

  handleDisconnect(socket) {
    try {
      const user = db.getUser(socket.id);
      
      if (user) {
        console.log(`${user.username} disconnected`);
        this.io.emit('user_left', user);
      }
      
      db.removeUser(socket.id);
      
      this.io.emit('user_list', db.getAllUsers());
      this.io.emit('typing_users', db.getTypingUsers('global'));
      
    } catch (error) {
      console.error('Error in handleDisconnect:', error);
    }
  }
}

module.exports = SocketController;
