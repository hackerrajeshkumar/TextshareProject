// Chat functionality
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatPanel = document.getElementById('chat-panel');
  const toggleChatBtn = document.getElementById('toggle-chat-btn');
  const chatHeader = document.querySelector('.chat-header');
  const chatMessages = document.getElementById('chat-messages');
  const chatMessageInput = document.getElementById('chat-message-input');
  const sendMessageBtn = document.getElementById('send-message-btn');
  
  // Socket.io connection
  const socket = io();
  
  // State
  let currentTextId = null;
  let username = generateUsername();
  
  // Initialize chat
  initializeChat();
  
  // Toggle chat panel
  chatHeader.addEventListener('click', (e) => {
    // Ignore clicks on the send button
    if (e.target === sendMessageBtn || e.target.closest('#send-message-btn')) {
      return;
    }
    
    chatPanel.classList.toggle('open');
    
    // Update icon
    const icon = toggleChatBtn.querySelector('i');
    if (chatPanel.classList.contains('open')) {
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-up');
    } else {
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
    }
  });
  
  // Send message
  sendMessageBtn.addEventListener('click', () => {
    sendMessage();
  });
  
  // Send message on Enter key
  chatMessageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Socket events
  
  // Receive chat message
  socket.on('chat-message', (data) => {
    addChatMessage(data.message, data.sender, data.timestamp, data.sender !== username);
  });
  
  // Text updated by another user
  socket.on('text-updated', (data) => {
    // Update editor with new text
    const textEditor = document.getElementById('text-editor');
    const syntaxSelect = document.getElementById('syntax-select');
    
    // Only update if the text is different
    if (textEditor.value !== data.text) {
      textEditor.value = data.text;
      
      // Update syntax if provided
      if (data.syntax) {
        syntaxSelect.value = data.syntax;
      }
      
      // Update preview if needed
      if (typeof updatePreview === 'function') {
        updatePreview();
      }
      
      // Add system message
      addSystemMessage('Text updated by another user');
    }
  });
  
  // Functions
  
  // Initialize chat
  function initializeChat() {
    // Check URL for text ID
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      currentTextId = pathSegments[0];
      
      // Join the room
      socket.emit('join', currentTextId);
      
      // Enable chat
      enableChat();
      
      // Add system message
      addSystemMessage('Connected to chat. Share your code with others to collaborate.');
      
      // Update code display
      updateCodeDisplay(currentTextId);
    }
    
    // Listen for text ID changes
    document.addEventListener('textIdChanged', (e) => {
      const newTextId = e.detail.textId;
      
      // If text ID changed
      if (currentTextId !== newTextId) {
        // Leave previous room if any
        if (currentTextId) {
          socket.emit('leave', currentTextId);
        }
        
        currentTextId = newTextId;
        
        // Join new room
        socket.emit('join', currentTextId);
        
        // Enable chat
        enableChat();
        
        // Clear previous messages
        chatMessages.innerHTML = '';
        
        // Add system message
        addSystemMessage('Connected to chat. Share your code with others to collaborate.');
        
        // Update code display
        updateCodeDisplay(currentTextId);
      }
    });
  }
  
  // Send message
  function sendMessage() {
    const message = chatMessageInput.value.trim();
    
    if (!message || !currentTextId) return;
    
    // Emit message to server
    socket.emit('chat-message', {
      textId: currentTextId,
      message,
      sender: username
    });
    
    // Clear input
    chatMessageInput.value = '';
  }
  
  // Add chat message to the UI
  function addChatMessage(message, sender, timestamp, isReceived = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isReceived ? 'received' : 'sent'}`;
    
    const senderElement = document.createElement('div');
    senderElement.className = 'message-sender';
    senderElement.textContent = sender;
    
    const textElement = document.createElement('div');
    textElement.className = 'message-text';
    textElement.textContent = message;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = formatTime(timestamp);
    
    messageElement.appendChild(senderElement);
    messageElement.appendChild(textElement);
    messageElement.appendChild(timeElement);
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Open chat panel if closed
    if (!chatPanel.classList.contains('open')) {
      chatHeader.click();
    }
  }
  
  // Add system message
  function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'system-message';
    
    const textElement = document.createElement('p');
    textElement.textContent = message;
    
    messageElement.appendChild(textElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Enable chat
  function enableChat() {
    chatMessageInput.disabled = false;
    sendMessageBtn.disabled = false;
  }
  
  // Generate a random username
  function generateUsername() {
    const adjectives = ['Happy', 'Clever', 'Swift', 'Brave', 'Calm', 'Eager', 'Gentle', 'Jolly', 'Kind', 'Lively'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox', 'Wolf', 'Bear', 'Hawk', 'Lion', 'Owl'];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${randomAdjective}${randomNoun}`;
  }
  
  // Format timestamp
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Update code display
  function updateCodeDisplay(code) {
    const codeDisplay = document.getElementById('code-display');
    if (codeDisplay) {
      codeDisplay.textContent = code;
    }
  }
});
