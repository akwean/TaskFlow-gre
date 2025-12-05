const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Board = require('../models/Board');

let io;

const connectedUsers = new Map(); // socket.id -> { userId }
// Track per-board per-list focus sets: boardId -> listId -> Set(socketId)
const listFocus = new Map();

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        let userId = null;
        if (token) {
            try {
                const payload = jwt.verify(token, process.env.JWT_SECRET);
                userId = payload.id || payload._id || null;
            } catch (e) {
                // Invalid token; continue without user context
            }
        }
        connectedUsers.set(socket.id, { userId });

        // Join a personal room for targeted dashboard updates
        if (userId) {
            socket.join(`user:${userId}`);
        }

        socket.on('join-board', async ({ boardId }) => {
            if (!boardId) return;
            // Validate access: owner or member
            try {
                const board = await Board.findById(boardId).select('owner members');
                const uid = connectedUsers.get(socket.id)?.userId;
                const allowed = !!(board && uid && (String(board.owner) === String(uid) || board.members.some(m => String(m.user) === String(uid))));
                if (!allowed) {
                    socket.emit('auth:error', { message: 'Not authorized to join board' });
                    return;
                }
            } catch (e) {
                socket.emit('auth:error', { message: 'Unable to validate board access' });
                return;
            }
            socket.join(`board:${boardId}`);
            emitPresence(boardId);
        });

        socket.on('leave-board', ({ boardId }) => {
            if (!boardId) return;
            socket.leave(`board:${boardId}`);
            emitPresence(boardId);
        });

        // Ephemeral cursor updates
        socket.on('cursor:move', ({ boardId, x, y, name, color }) => {
            if (!boardId) return;
            const uid = connectedUsers.get(socket.id)?.userId || null;
            io.to(`board:${boardId}`).emit('cursor:move', {
                socketId: socket.id,
                userId: uid,
                x,
                y,
                name,
                color,
            });
        });

        socket.on('cursor:leave', ({ boardId }) => {
            if (!boardId) return;
            io.to(`board:${boardId}`).emit('cursor:leave', { socketId: socket.id });
        });

        // Typing indicators
        socket.on('typing:boardTitle', ({ boardId, isTyping }) => {
            if (!boardId) return;
            const uid = connectedUsers.get(socket.id)?.userId || null;
            io.to(`board:${boardId}`).emit('typing:boardTitle', { userId: uid, isTyping: !!isTyping });
        });

        socket.on('typing:card', ({ boardId, cardId, isTyping }) => {
            if (!boardId || !cardId) return;
            const uid = connectedUsers.get(socket.id)?.userId || null;
            io.to(`board:${boardId}`).emit('typing:card', { userId: uid, cardId, isTyping: !!isTyping });
        });

        // Per-list presence focus
        socket.on('list:focus', ({ boardId, listId, focused }) => {
            if (!boardId || !listId) return;
            const roomKey = String(boardId);
            if (!listFocus.has(roomKey)) listFocus.set(roomKey, new Map());
            const listsMap = listFocus.get(roomKey);
            if (!listsMap.has(listId)) listsMap.set(listId, new Set());
            const set = listsMap.get(listId);
            if (focused) set.add(socket.id);
            else set.delete(socket.id);
            io.to(`board:${boardId}`).emit('list:presence', { listId, count: set.size });
        });

        // Ensure presence updates propagate when a socket disconnects
        socket.on('disconnecting', () => {
            const rooms = Array.from(socket.rooms || []);
            rooms.forEach((room) => {
                if (room.startsWith('board:')) {
                    const boardId = room.split(':')[1];
                    // Defer until the socket is fully out of the room
                    setTimeout(() => emitPresence(boardId), 0);
                    // Clean up list focus entries for this socket
                    const maps = listFocus.get(String(boardId));
                    if (maps) {
                        for (const [listId, set] of maps.entries()) {
                            if (set.delete(socket.id)) {
                                io.to(`board:${boardId}`).emit('list:presence', { listId, count: set.size });
                            }
                        }
                    }
                }
            });
        });

        socket.on('disconnect', () => {
            connectedUsers.delete(socket.id);
            // Presence per board is recalculated lazily on next event
        });
    });
}

function emitPresence(boardId) {
    if (!io) return;
    const room = io.sockets.adapter.rooms.get(`board:${boardId}`);
    const count = room ? room.size : 0;
    let userIds = [];
    if (room && room.size > 0) {
        const ids = Array.from(room);
        userIds = ids
            .map((sid) => connectedUsers.get(sid)?.userId)
            .filter(Boolean)
            .map((v) => String(v));
        // unique
        userIds = Array.from(new Set(userIds));
    }
    io.to(`board:${boardId}`).emit('presence:update', { count, userIds });
}

function getIO() {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
}

function emitToBoard(boardId, event, payload) {
    if (!io) return;
    io.to(`board:${boardId}`).emit(event, payload);
}

function emitToUser(userId, event, payload) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToBoard, emitToUser, emitPresence };
