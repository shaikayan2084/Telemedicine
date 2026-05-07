/**
 * WebRTC Signaling Server
 * Handles SDP exchange and ICE candidate negotiation
 * for peer-to-peer encrypted video consultations
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../backend/.env' });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Active rooms map: roomId -> Set of socket IDs
const rooms = new Map();

// ─── JWT Middleware for Socket.io ─────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'room_access') return next(new Error('Invalid token type'));
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

// ─── Connection Handler ───────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.user.userId}`);

  // ── Join Room ───────────────────────────────────────────────────────────
  socket.on('join-room', ({ roomId }) => {
    if (socket.user.appointmentId !== roomId && socket.user.appointmentId) {
      // Validate room matches token
      socket.emit('error', { message: 'Room ID does not match your appointment token' });
      return;
    }

    socket.join(roomId);

    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId).add(socket.id);

    const peers = [...rooms.get(roomId)].filter((id) => id !== socket.id);
    console.log(`📞 ${socket.user.userId} joined room ${roomId}. Peers: ${peers.length}`);

    // Notify existing peers
    socket.to(roomId).emit('peer-joined', { peerId: socket.id, userId: socket.user.userId });

    // Send existing peers list to new joiner
    socket.emit('room-joined', { peers, roomId });
  });

  // ── SDP Offer ────────────────────────────────────────────────────────────
  socket.on('offer', ({ targetId, sdp }) => {
    console.log(`📤 Offer: ${socket.id} → ${targetId}`);
    socket.to(targetId).emit('offer', { sdp, fromId: socket.id });
  });

  // ── SDP Answer ───────────────────────────────────────────────────────────
  socket.on('answer', ({ targetId, sdp }) => {
    console.log(`📥 Answer: ${socket.id} → ${targetId}`);
    socket.to(targetId).emit('answer', { sdp, fromId: socket.id });
  });

  // ── ICE Candidate ─────────────────────────────────────────────────────────
  socket.on('ice-candidate', ({ targetId, candidate }) => {
    socket.to(targetId).emit('ice-candidate', { candidate, fromId: socket.id });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        if (rooms.get(roomId).size === 0) rooms.delete(roomId);
      }
      socket.to(roomId).emit('peer-left', { peerId: socket.id });
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

const PORT = process.env.SIGNALING_PORT || 4000;
server.listen(PORT, () => {
  console.log(`📡 Signaling server running on port ${PORT}`);
});
