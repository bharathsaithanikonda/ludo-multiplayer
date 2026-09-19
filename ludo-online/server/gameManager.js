/**
 * gameManager.js - Room Management, Session State, and Turn Coordination
 */

const crypto = require('crypto');
const {
  PLAYER_COLORS,
  PLAYER_CONFIG,
  createInitialTokens,
  getLegalMoves,
  executeMove
} = require('./ludoRules');

class GameManager {
  constructor() {
    this.rooms = new Map();
    // Auto cleanup stale rooms every 15 minutes
    setInterval(() => this.cleanupStaleRooms(), 15 * 60 * 1000);
  }

  generateRoomCode() {
    let code;
    do {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let part = '';
      for (let i = 0; i < 5; i++) {
        part += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `LUDO-${part}`;
    } while (this.rooms.has(code));
    return code;
  }

  generateSessionToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  createRoom(hostName, socketId) {
    const roomCode = this.generateRoomCode();
    const sessionToken = this.generateSessionToken();

    const hostPlayer = {
      playerIndex: 0,
      name: hostName || 'Player 1',
      color: PLAYER_COLORS[0],
      socketId,
      sessionToken,
      connected: true,
      isHost: true,
      disconnectedAt: null
    };

    const room = {
      code: roomCode,
      createdAt: Date.now(),
      status: 'waiting', // 'waiting' | 'playing' | 'finished'
      players: [hostPlayer],
      currentTurn: 0,
      phase: 'rolling', // 'rolling' | 'moving' | 'finished'
      diceValue: null,
      consecutiveSixes: 0,
      legalMoves: [],
      winner: null,
      tokens: createInitialTokens(),
      chatHistory: [],
      moveHistory: []
    };

    this.rooms.set(roomCode, room);
    return { room, player: hostPlayer, sessionToken };
  }

  joinRoom(roomCode, playerName, socketId, sessionToken = null) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { success: false, error: 'Room not found. Please check the code.' };
    }

    // Check if player is reconnecting with an existing sessionToken
    if (sessionToken) {
      const existingPlayer = room.players.find(p => p.sessionToken === sessionToken);
      if (existingPlayer) {
        existingPlayer.socketId = socketId;
        existingPlayer.connected = true;
        existingPlayer.disconnectedAt = null;
        return {
          success: true,
          isReconnect: true,
          room,
          player: existingPlayer,
          sessionToken: existingPlayer.sessionToken
        };
      }
    }

    // Room full check (max 4 players)
    if (room.players.length >= 4) {
      return { success: false, error: 'Room is full (Maximum 4 players).' };
    }

    // Cannot join if game is already running and not a reconnect
    if (room.status !== 'waiting') {
      return { success: false, error: 'Game is already in progress.' };
    }

    const nextIndex = room.players.length;
    const newSessionToken = this.generateSessionToken();

    const newPlayer = {
      playerIndex: nextIndex,
      name: playerName || `Player ${nextIndex + 1}`,
      color: PLAYER_COLORS[nextIndex],
      socketId,
      sessionToken: newSessionToken,
      connected: true,
      isHost: false,
      disconnectedAt: null
    };

    room.players.push(newPlayer);

    return {
      success: true,
      isReconnect: false,
      room,
      player: newPlayer,
      sessionToken: newSessionToken
    };
  }

  startGame(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    const host = room.players.find(p => p.isHost);
    if (!host || host.socketId !== socketId) {
      return { success: false, error: 'Only the host can start the game.' };
    }

    if (room.players.length < 2) {
      return { success: false, error: 'At least 2 players are required to start.' };
    }

    room.status = 'playing';
    room.currentTurn = 0; // Red starts
    room.phase = 'rolling';
    room.diceValue = null;
    room.consecutiveSixes = 0;
    room.legalMoves = [];
    room.winner = null;
    room.tokens = createInitialTokens();
    room.moveHistory = [];

    return { success: true, room };
  }

  rollDice(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    if (room.status !== 'playing') {
      return { success: false, error: 'Game is not in progress.' };
    }

    const player = room.players[room.currentTurn];
    if (!player || player.socketId !== socketId) {
      return { success: false, error: "Not your turn to roll the dice." };
    }

    if (room.phase !== 'rolling') {
      return { success: false, error: 'Dice already rolled for this turn.' };
    }

    // Authoritative dice roll (1 to 6)
    const diceValue = Math.floor(Math.random() * 6) + 1;
    room.diceValue = diceValue;

    if (diceValue === 6) {
      room.consecutiveSixes += 1;
    } else {
      room.consecutiveSixes = 0;
    }

    // Rule: 3 consecutive sixes ends turn immediately without moving
    if (room.consecutiveSixes >= 3) {
      const skippedPlayer = room.currentTurn;
      this.advanceTurn(room);
      return {
        success: true,
        diceValue,
        consecutiveSixes: 3,
        threeSixesPenalty: true,
        legalMoves: [],
        nextTurn: room.currentTurn,
        playerIndex: skippedPlayer,
        room
      };
    }

    // Compute legal moves
    const legalMoves = getLegalMoves(room.currentTurn, room.tokens, diceValue);
    room.legalMoves = legalMoves;

    if (legalMoves.length === 0) {
      // No legal moves available
      room.phase = 'rolling';
      const prevTurn = room.currentTurn;
      this.advanceTurn(room);
      return {
        success: true,
        diceValue,
        consecutiveSixes: room.consecutiveSixes,
        legalMoves: [],
        autoPass: true,
        playerIndex: prevTurn,
        nextTurn: room.currentTurn,
        room
      };
    }

    // Wait for player to choose token to move
    room.phase = 'moving';
    return {
      success: true,
      diceValue,
      consecutiveSixes: room.consecutiveSixes,
      legalMoves,
      playerIndex: room.currentTurn,
      room
    };
  }

  moveToken(roomCode, socketId, tokenId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    if (room.status !== 'playing') {
      return { success: false, error: 'Game is not active.' };
    }

    const player = room.players[room.currentTurn];
    if (!player || player.socketId !== socketId) {
      return { success: false, error: "Not your turn." };
    }

    if (room.phase !== 'moving') {
      return { success: false, error: 'Must roll dice first.' };
    }

    if (!room.legalMoves.includes(tokenId)) {
      return { success: false, error: 'This token cannot make a legal move.' };
    }

    // Authoritative move execution
    const result = executeMove(
      { tokens: room.tokens, consecutiveSixes: room.consecutiveSixes },
      room.currentTurn,
      tokenId,
      room.diceValue
    );

    if (!result.success) {
      return result;
    }

    // Check winner
    if (result.isWinner) {
      room.status = 'finished';
      room.phase = 'finished';
      room.winner = {
        playerIndex: room.currentTurn,
        name: player.name,
        color: player.color
      };
      return {
        success: true,
        moveResult: result,
        gameWon: true,
        winner: room.winner,
        room
      };
    }

    // Determine next turn
    if (result.extraTurn) {
      // Player rolls again
      room.phase = 'rolling';
      room.legalMoves = [];
      room.diceValue = null;
    } else {
      // Advance to next player
      room.consecutiveSixes = 0;
      this.advanceTurn(room);
    }

    return {
      success: true,
      moveResult: result,
      gameWon: false,
      extraTurn: result.extraTurn,
      nextTurn: room.currentTurn,
      room
    };
  }

  advanceTurn(room) {
    room.phase = 'rolling';
    room.diceValue = null;
    room.legalMoves = [];
    room.currentTurn = (room.currentTurn + 1) % room.players.length;
  }

  restartGame(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    const host = room.players.find(p => p.isHost);
    if (!host || host.socketId !== socketId) {
      return { success: false, error: 'Only the host can restart the game.' };
    }

    room.status = 'playing';
    room.currentTurn = 0;
    room.phase = 'rolling';
    room.diceValue = null;
    room.consecutiveSixes = 0;
    room.legalMoves = [];
    room.winner = null;
    room.tokens = createInitialTokens();
    room.moveHistory = [];

    return { success: true, room };
  }

  handleDisconnect(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        player.connected = false;
        player.disconnectedAt = Date.now();
        return { room, player };
      }
    }
    return null;
  }

  leaveRoom(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const leavingPlayerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (leavingPlayerIndex === -1) return null;

    const leavingPlayer = room.players[leavingPlayerIndex];

    if (room.status === 'waiting') {
      // In lobby: remove player completely
      room.players.splice(leavingPlayerIndex, 1);
      // Reassign indices and colors
      room.players.forEach((p, idx) => {
        p.playerIndex = idx;
        p.color = PLAYER_COLORS[idx];
        if (idx === 0) p.isHost = true;
      });

      if (room.players.length === 0) {
        this.rooms.delete(roomCode);
        return { roomClosed: true };
      }

      return { room, leavingPlayer, roomClosed: false };
    } else {
      // In game: mark disconnected or forfeit
      leavingPlayer.connected = false;
      leavingPlayer.disconnectedAt = Date.now();
      
      // If leaving player was active player, advance turn
      if (room.currentTurn === leavingPlayerIndex) {
        this.advanceTurn(room);
      }

      // Check if all players have disconnected
      const activeCount = room.players.filter(p => p.connected).length;
      if (activeCount === 0) {
        this.rooms.delete(roomCode);
        return { roomClosed: true };
      }

      return { room, leavingPlayer, roomClosed: false };
    }
  }

  getPublicRoomState(room) {
    return {
      code: room.code,
      status: room.status,
      players: room.players.map(p => ({
        playerIndex: p.playerIndex,
        name: p.name,
        color: p.color,
        connected: p.connected,
        isHost: p.isHost
      })),
      currentTurn: room.currentTurn,
      phase: room.phase,
      diceValue: room.diceValue,
      consecutiveSixes: room.consecutiveSixes,
      legalMoves: room.legalMoves,
      tokens: room.tokens,
      winner: room.winner,
      createdAt: room.createdAt
    };
  }

  cleanupStaleRooms() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      // Remove rooms older than 6 hours or with all players disconnected for 15 minutes
      const allDisconnected = room.players.every(p => !p.connected);
      const isStale = allDisconnected && room.players.every(p => p.disconnectedAt && (now - p.disconnectedAt > 15 * 60 * 1000));
      if (now - room.createdAt > 6 * 3600 * 1000 || isStale) {
        this.rooms.delete(code);
      }
    }
  }
}

module.exports = GameManager;
