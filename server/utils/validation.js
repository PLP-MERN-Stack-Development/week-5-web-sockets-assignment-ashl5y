const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message is required' };
  }

  if (message.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }


  if (message.length > 1000) {
    return { isValid: false, error: 'Message is too long (max 1000 characters)' };
  }

  return { isValid: true };
};

const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.trim().length < 2) {
    return { isValid: false, error: 'Username must be at least 2 characters long' };
  }

  if (username.length > 50) {
    return { isValid: false, error: 'Username is too long (max 50 characters)' };
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { isValid: true };
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

const validateRoomId = (roomId) => {
  if (!roomId || typeof roomId !== 'string') {
    return { isValid: false, error: 'Room ID is required' };
  }

  if (roomId.length > 100) {
    return { isValid: false, error: 'Room ID is too long' };
  }

  const roomIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!roomIdRegex.test(roomId)) {
    return { isValid: false, error: 'Room ID can only contain letters, numbers, underscores, and hyphens' };
  }

  return { isValid: true };
};

const validateFileUpload = (fileData) => {
  if (!fileData || typeof fileData !== 'object') {
    return { isValid: false, error: 'File data is required' };
  }

  const { fileName, fileType, fileSize } = fileData;

  if (!fileName || typeof fileName !== 'string') {
    return { isValid: false, error: 'File name is required' };
  }

  if (!fileType || typeof fileType !== 'string') {
    return { isValid: false, error: 'File type is required' };
  }

  if (!fileSize || typeof fileSize !== 'number') {
    return { isValid: false, error: 'File size is required' };
  }

  if (fileSize > 10 * 1024 * 1024) {
    return { isValid: false, error: 'File size too large (max 10MB)' };
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(fileType)) {
    return { isValid: false, error: 'File type not allowed' };
  }

  return { isValid: true };
};

module.exports = {
  validateMessage,
  validateUsername,
  validateRoomId,
  validateFileUpload,
  sanitizeInput
};