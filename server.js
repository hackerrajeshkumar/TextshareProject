const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const apiRoutes = require('./routes/api');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '1mb' })); // Parse JSON bodies with size limit
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// API routes
app.use('/api', apiRoutes);

// Serve the main HTML file for all routes except API
app.get('*', (req, res) => {
  // Skip API routes
  if (req.url.startsWith('/api')) return;

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a room based on text ID
  socket.on('join', (textId) => {
    socket.join(textId);
    console.log(`Client joined room: ${textId}`);

    // Update last activity timestamp
    updateLastActivity(textId);
  });

  // Handle text updates
  socket.on('text-update', (data) => {
    const { textId, text, syntax } = data;

    // Broadcast to all clients in the room except sender
    socket.to(textId).emit('text-updated', { text, syntax });

    // Update last activity timestamp
    updateLastActivity(textId);
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    const { textId, message, sender } = data;

    // Broadcast to all clients in the room
    io.to(textId).emit('chat-message', { message, sender, timestamp: Date.now() });

    // Update last activity timestamp
    updateLastActivity(textId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Function to update last activity timestamp
function updateLastActivity(textId) {
  // Update the last activity timestamp in the text data
  const { getText } = require('./utils/storage');
  const { saveText } = require('./utils/storage');

  getText(textId).then(textData => {
    if (textData) {
      textData.lastActivity = Date.now();
      textData.expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      saveText(textId, textData);
    }
  }).catch(err => {
    console.error('Error updating last activity:', err);
  });
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
