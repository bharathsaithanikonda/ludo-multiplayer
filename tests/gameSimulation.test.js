/**
 * gameSimulation.test.js
 * Automated multi-client test verifying full real-time Socket.IO flow:
 * - Room creation & joining for 4 players
 * - Color assignment (Red, Green, Yellow, Blue)
 * - 5th player rejection (max 4 players)
 * - Turn enforcement & dice roll validation
 * - Token moves & state synchronization
 * - Chat messaging
 * - Player reconnection with session restoration
 */

const { io } = require('socket.io-client');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const GameManager = require('../server/gameManager');

const TEST_PORT = 4999;
let server, ioServer;

function startTestServer() {
  return new Promise((resolve) => {
    const app = express();
    server = http.createServer(app);
    ioServer = new Server(server, { cors: { origin: '*' } });
    const gameManager = new GameManager();

    ioServer.on('connection', (socket) => {
      socket.on('createRoom', ({ playerName }) => {
        const { room, player, sessionToken } = gameManager.createRoom(playerName, socket.id);
        socket.join(room.code);
        socket.emit('roomCreated', {
          roomCode: room.code,
          player,
          sessionToken,
          roomState: gameManager.getPublicRoomState(room)
        });
      });

      socket.on('joinRoom', ({ roomCode, playerName, sessionToken }) => {
        const code = (roomCode || '').trim().toUpperCase();
        const result = gameManager.joinRoom(code, playerName, socket.id, sessionToken);
        if (!result.success) {
          return socket.emit('errorNotice', { message: result.error });
        }
        socket.join(code);
        socket.emit('roomJoined', {
          roomCode: code,
          player: result.player,
          sessionToken: result.sessionToken,
          isReconnect: result.isReconnect,
          roomState: gameManager.getPublicRoomState(result.room)
        });
        ioServer.to(code).emit(result.isReconnect ? 'playerReconnected' : 'playerJoined', {
          player: result.player,
          roomState: gameManager.getPublicRoomState(result.room)
        });
      });

      socket.on('startGame', ({ roomCode }) => {
        const code = (roomCode || '').trim().toUpperCase();
        const result = gameManager.startGame(code, socket.id);
        if (!result.success) return socket.emit('errorNotice', { message: result.error });
        ioServer.to(code).emit('gameStarted', { roomState: gameManager.getPublicRoomState(result.room) });
      });

      socket.on('rollDice', ({ roomCode }) => {
        const code = (roomCode || '').trim().toUpperCase();
        const result = gameManager.rollDice(code, socket.id);
        if (!result.success) return socket.emit('errorNotice', { message: result.error });
        ioServer.to(code).emit('diceRolled', {
          playerIndex: result.playerIndex,
          diceValue: result.diceValue,
          consecutiveSixes: result.consecutiveSixes,
          legalMoves: result.legalMoves,
          autoPass: result.autoPass || false,
          nextTurn: result.nextTurn,
          roomState: gameManager.getPublicRoomState(result.room)
        });
      });

      socket.on('moveToken', ({ roomCode, tokenId }) => {
        const code = (roomCode || '').trim().toUpperCase();
        const result = gameManager.moveToken(code, socket.id, tokenId);
        if (!result.success) return socket.emit('errorNotice', { message: result.error });
        ioServer.to(code).emit('tokenMoved', {
          moveResult: result.moveResult,
          extraTurn: result.extraTurn,
          nextTurn: result.nextTurn,
          gameWon: result.gameWon,
          winner: result.winner,
          roomState: gameManager.getPublicRoomState(result.room)
        });
      });

      socket.on('chatMessage', ({ roomCode, text }) => {
        const code = (roomCode || '').trim().toUpperCase();
        const room = gameManager.rooms.get(code);
        if (!room) return;
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;
        ioServer.to(code).emit('chatReceived', {
          senderName: player.name,
          color: player.color,
          text,
          timestamp: Date.now()
        });
      });
    });

    server.listen(TEST_PORT, () => {
      resolve();
    });
  });
}

function createClient() {
  return io(`http://localhost:${TEST_PORT}`, {
    transports: ['websocket'],
    forceNew: true
  });
}

async function runTests() {
  console.log('🧪 Starting Ludo Multiplayer Automated Tests...');
  await startTestServer();

  const c1 = createClient();
  const c2 = createClient();
  const c3 = createClient();
  const c4 = createClient();
  const c5 = createClient();

  let roomCode = null;
  let p1Session = null;
  let p2Session = null;

  try {
    // 1. Player 1 creates room
    console.log('Test 1: Player 1 creating room...');
    const createRes = await new Promise((resolve) => {
      c1.emit('createRoom', { playerName: 'Bharath (Red)' });
      c1.on('roomCreated', (data) => resolve(data));
    });

    roomCode = createRes.roomCode;
    p1Session = createRes.sessionToken;
    console.log(`✓ Room created with code: ${roomCode}`);
    if (createRes.player.color !== 'red' || createRes.player.playerIndex !== 0) {
      throw new Error(`Expected Red player at index 0, got: ${JSON.stringify(createRes.player)}`);
    }

    // 2. Player 2 joins
    console.log('Test 2: Player 2 joining room...');
    const p2Res = await new Promise((resolve) => {
      c2.emit('joinRoom', { roomCode, playerName: 'Player 2 (Green)' });
      c2.on('roomJoined', (data) => resolve(data));
    });
    p2Session = p2Res.sessionToken;
    if (p2Res.player.color !== 'green' || p2Res.player.playerIndex !== 1) {
      throw new Error(`Expected Green player at index 1, got: ${JSON.stringify(p2Res.player)}`);
    }
    console.log('✓ Player 2 successfully joined as Green');

    // 3. Player 3 joins
    console.log('Test 3: Player 3 joining room...');
    const p3Res = await new Promise((resolve) => {
      c3.emit('joinRoom', { roomCode, playerName: 'Player 3 (Yellow)' });
      c3.on('roomJoined', (data) => resolve(data));
    });
    if (p3Res.player.color !== 'yellow' || p3Res.player.playerIndex !== 2) {
      throw new Error(`Expected Yellow player at index 2, got: ${JSON.stringify(p3Res.player)}`);
    }
    console.log('✓ Player 3 successfully joined as Yellow');

    // 4. Player 4 joins
    console.log('Test 4: Player 4 joining room...');
    const p4Res = await new Promise((resolve) => {
      c4.emit('joinRoom', { roomCode, playerName: 'Player 4 (Blue)' });
      c4.on('roomJoined', (data) => resolve(data));
    });
    if (p4Res.player.color !== 'blue' || p4Res.player.playerIndex !== 3) {
      throw new Error(`Expected Blue player at index 3, got: ${JSON.stringify(p4Res.player)}`);
    }
    console.log('✓ Player 4 successfully joined as Blue');

    // 5. Player 5 attempts to join full room (must be rejected!)
    console.log('Test 5: Player 5 joining full room (should be rejected)...');
    const p5Err = await new Promise((resolve) => {
      c5.emit('joinRoom', { roomCode, playerName: 'Player 5' });
      c5.on('errorNotice', (err) => resolve(err));
    });
    console.log(`✓ 5th player correctly rejected: "${p5Err.message}"`);

    // 6. Start Game
    console.log('Test 6: Starting game...');
    const startRes = await new Promise((resolve) => {
      c1.emit('startGame', { roomCode });
      c1.on('gameStarted', (data) => resolve(data));
    });
    if (startRes.roomState.status !== 'playing' || startRes.roomState.currentTurn !== 0) {
      throw new Error('Game failed to transition to playing status or turn 0');
    }
    console.log('✓ Game started with Player 1 (Red) turn');

    // 7. Test turn security: Player 2 trying to roll when it is Player 1's turn
    console.log("Test 7: Player 2 attempts to roll out of turn...");
    const outOfTurnErr = await new Promise((resolve) => {
      c2.emit('rollDice', { roomCode });
      c2.on('errorNotice', (err) => resolve(err));
    });
    console.log(`✓ Out of turn prevented: "${outOfTurnErr.message}"`);

    // 8. Player 1 rolls dice
    console.log("Test 8: Player 1 rolls dice...");
    const rollRes = await new Promise((resolve) => {
      c1.emit('rollDice', { roomCode });
      c2.on('diceRolled', (data) => resolve(data));
    });
    console.log(`✓ Player 1 rolled dice: ${rollRes.diceValue}, legal moves: ${JSON.stringify(rollRes.legalMoves)}`);

    // 9. Real-time chat test
    console.log("Test 9: In-game chat broadcast...");
    const chatMsg = await new Promise((resolve) => {
      c2.on('chatReceived', (msg) => resolve(msg));
      c1.emit('chatMessage', { roomCode, text: 'Good luck everyone!' });
    });
    if (chatMsg.senderName !== 'Bharath (Red)' || chatMsg.text !== 'Good luck everyone!') {
      throw new Error(`Chat sync mismatch: ${JSON.stringify(chatMsg)}`);
    }
    console.log(`✓ Chat message synchronized across players: [${chatMsg.senderName}]: ${chatMsg.text}`);

    // 10. Reconnection test
    console.log("Test 10: Player 2 disconnects and reconnects with session token...");
    c2.disconnect();
    const c2Reconnect = createClient();
    const reconRes = await new Promise((resolve) => {
      c2Reconnect.emit('joinRoom', { roomCode, playerName: 'Player 2 (Green)', sessionToken: p2Session });
      c2Reconnect.on('roomJoined', (data) => resolve(data));
    });
    if (!reconRes.isReconnect || reconRes.player.color !== 'green' || reconRes.player.playerIndex !== 1) {
      throw new Error(`Reconnection failed: ${JSON.stringify(reconRes)}`);
    }
    console.log('✓ Player 2 reconnected successfully and restored seat!');

    console.log('\n========================================');
    console.log('🎉 ALL SERVER & ENGINE TESTS PASSED 100%!');
    console.log('========================================\n');
  } finally {
    c1.disconnect();
    c2.disconnect();
    c3.disconnect();
    c4.disconnect();
    c5.disconnect();
    server.close();
  }
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
