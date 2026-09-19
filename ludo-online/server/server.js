/**
 * server.js - Real-time Authoritative Ludo Game Server
 * Node.js + Express + Socket.IO
 */

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);

// Allow configurable CORS for production deployment
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

const gameManager = new GameManager();

// Serve static client files
const clientPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientPath));

// Health check endpoint for cloud platforms (Render, Railway, Fly.io, etc.)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Fallback to index.html for client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Socket.IO real-time connection handler
io.on('connection', (socket) => {
  // 1. Create Room
  socket.on('createRoom', ({ playerName }) => {
    try {
      const { room, player, sessionToken } = gameManager.createRoom(playerName, socket.id);
      socket.join(room.code);
      socket.emit('roomCreated', {
        roomCode: room.code,
        player,
        sessionToken,
        roomState: gameManager.getPublicRoomState(room)
      });
    } catch (err) {
      socket.emit('errorNotice', { message: 'Failed to create room: ' + err.message });
    }
  });

  // 2. Join Room
  socket.on('joinRoom', ({ roomCode, playerName, sessionToken }) => {
    try {
      const code = (roomCode || '').trim().toUpperCase();
      const result = gameManager.joinRoom(code, playerName, socket.id, sessionToken);

      if (!result.success) {
        return socket.emit('errorNotice', { message: result.error });
      }

      socket.join(code);

      // Tell the joining player their state
      socket.emit('roomJoined', {
        roomCode: code,
        player: result.player,
        sessionToken: result.sessionToken,
        isReconnect: result.isReconnect,
        roomState: gameManager.getPublicRoomState(result.room)
      });

      // Notify everyone in the room
      if (result.isReconnect) {
        io.to(code).emit('playerReconnected', {
          player: result.player,
          roomState: gameManager.getPublicRoomState(result.room)
        });
      } else {
        io.to(code).emit('playerJoined', {
          player: result.player,
          roomState: gameManager.getPublicRoomState(result.room)
        });
      }
    } catch (err) {
      socket.emit('errorNotice', { message: 'Failed to join room: ' + err.message });
    }
  });

  // 3. Start Game
  socket.on('startGame', ({ roomCode }) => {
    try {
      const code = (roomCode || '').trim().toUpperCase();
      const result = gameManager.startGame(code, socket.id);

      if (!result.success) {
        return socket.emit('errorNotice', { message: result.error });
      }

      io.to(code).emit('gameStarted', {
        roomState: gameManager.getPublicRoomState(result.room)
      });
    } catch (err) {
      socket.emit('errorNotice', { message: err.message });
    }
  });

  // 4. Roll Dice
  socket.on('rollDice', ({ roomCode }) => {
    try {
      const code = (roomCode || '').trim().toUpperCase();
      const result = gameManager.rollDice(code, socket.id);

      if (!result.success) {
        return socket.emit('errorNotice', { message: result.error });
      }

      // Broadcast dice roll to all players
      io.to(code).emit('diceRolled', {
        playerIndex: result.playerIndex,
        diceValue: result.diceValue,
        consecutiveSixes: result.consecutiveSixes,
        threeSixesPenalty: result.threeSixesPenalty || false,
        autoPass: result.autoPass || false,
        legalMoves: result.legalMoves,
        nextTurn: result.nextTurn !== undefined ? result.nextTurn : null,
        roomState: gameManager.getPublicRoomState(result.room)
      });
    } catch (err) {
      socket.emit('errorNotice', { message: err.message });
    }
  });

  // 5. Move Token
  socket.on('moveToken', ({ roomCode, tokenId }) => {
    try {
      const code = (roomCode || '').trim().toUpperCase();
      const result = gameManager.moveToken(code, socket.id, tokenId);

      if (!result.success) {
        return socket.emit('errorNotice', { message: result.error });
      }

      // Broadcast authoritative token move to all players
      io.to(code).emit('tokenMoved', {
        moveResult: result.moveResult,
        extraTurn: result.extraTurn,
        nextTurn: result.nextTurn,
        gameWon: result.gameWon,
        winner: result.winner,
        roomState: gameManager.getPublicRoomState(result.room)
      });

      if (result.gameWon) {
        io.to(code).emit('gameWon', {
          winner: result.winner,
          roomState: gameManager.getPublicRoomState(result.room)
        });
      }
    } catch (err) {
      socket.emit('errorNotice', { message: err.message });
    }
  });

  // 6. In-game Chat
  socket.on('chatMessage', ({ roomCode, text }) => {
    try {
      const code = (roomCode || '').trim().toUpperCase();
      const room = gameManager.rooms.get(code);
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      const cleanText = (text || '').trim().substring(0, 150);
      if (!cleanText) return;

      const messageObj = {
        senderName: player.name,
        color: player.color,
        text: cleanText,
        timestamp: Date.now()
      };

      room.chatHistory.push(messageObj);
      if (room.chatHistory.length > 50) room.chatHistory.shift();

      io.to(code).emit('chatReceived', messageObj);
    } catch (err) {
      // Ignore chat error
    }
  });

  // 7. Restart Game
  socket.on('restartGame', ({ roomCode }) => {
    try {
      const code = (roomCode || '').trim().toUpperCase();
      const result = gameManager.restartGame(code, socket.id);

      if (!result.success) {
        return socket.emit('errorNotice', { message: result.error });
      }

      io.to(code).emit('gameRestarted', {
        roomState: gameManager.getPublicRoomState(result.room)
      });
    } catch (err) {
      socket.emit('errorNotice', { message: err.message });
    }
  });

  // 8. Leave Game
  socket.on('leaveRoom', ({ roomCode }) => {
    try {
      const code = (roomCode || '').trim().toUpperCase();
      const result = gameManager.leaveRoom(code, socket.id);
      if (result && !result.roomClosed) {
        io.to(code).emit('playerLeft', {
          player: result.leavingPlayer,
          roomState: gameManager.getPublicRoomState(result.room)
        });
      }
      socket.leave(code);
    } catch (err) {
      // Ignore
    }
  });

  // 9. Disconnect
  socket.on('disconnect', () => {
    const result = gameManager.handleDisconnect(socket.id);
    if (result && result.room) {
      io.to(result.room.code).emit('playerDisconnected', {
        player: result.player,
        roomState: gameManager.getPublicRoomState(result.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎲 Ludo Online server is running on port ${PORT}`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
});
