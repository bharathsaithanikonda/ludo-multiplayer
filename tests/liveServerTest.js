/**
 * liveServerTest.js
 * Comprehensive integration test against the LIVE server running on port 3000
 */

const http = require('http');
const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function createClient() {
  return io(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true
  });
}

async function runLiveTest() {
  console.log('🚀 Testing Live Ludo Server at', SERVER_URL);

  // 1. Health check test
  console.log('1. Checking /health endpoint...');
  const healthRes = await httpGet('/health');
  if (healthRes.statusCode !== 200) {
    throw new Error(`Health check failed with status: ${healthRes.statusCode}`);
  }
  console.log('✓ Health check returned 200 OK:', healthRes.body);

  // 2. Static files test
  console.log('2. Checking static assets (HTML, CSS, JS)...');
  const indexRes = await httpGet('/');
  if (indexRes.statusCode !== 200 || !indexRes.body.toLowerCase().includes('ludo online')) {
    throw new Error('Index HTML failed to serve or missing title');
  }
  const cssRes = await httpGet('/style.css');
  if (cssRes.statusCode !== 200 || !cssRes.body.includes('ludo-board')) {
    throw new Error('CSS file failed to serve or missing board rules');
  }
  const jsRes = await httpGet('/game.js');
  if (jsRes.statusCode !== 200 || !jsRes.body.includes('LudoClient')) {
    throw new Error('game.js failed to serve');
  }
  console.log('✓ All client static assets served correctly!');

  // 3. Multi-client Socket.IO test
  console.log('3. Connecting 4 players over live Socket.IO...');
  const c1 = createClient();
  const c2 = createClient();
  const c3 = createClient();
  const c4 = createClient();

  try {
    // Player 1 creates room
    const p1Data = await new Promise((resolve) => {
      c1.emit('createRoom', { playerName: 'Bharath' });
      c1.on('roomCreated', resolve);
    });
    const roomCode = p1Data.roomCode;
    console.log(`✓ Player 1 created room ${roomCode}, color: ${p1Data.player.color}`);
    if (p1Data.player.color !== 'red') throw new Error('Expected Player 1 to be red');

    // Player 2 joins
    const p2Data = await new Promise((resolve) => {
      c2.emit('joinRoom', { roomCode, playerName: 'Rahul' });
      c2.on('roomJoined', resolve);
    });
    console.log(`✓ Player 2 joined, color: ${p2Data.player.color}`);
    if (p2Data.player.color !== 'green') throw new Error('Expected Player 2 to be green');

    // Player 3 joins
    const p3Data = await new Promise((resolve) => {
      c3.emit('joinRoom', { roomCode, playerName: 'Anil' });
      c3.on('roomJoined', resolve);
    });
    console.log(`✓ Player 3 joined, color: ${p3Data.player.color}`);
    if (p3Data.player.color !== 'yellow') throw new Error('Expected Player 3 to be yellow');

    // Player 4 joins
    const p4Data = await new Promise((resolve) => {
      c4.emit('joinRoom', { roomCode, playerName: 'Priya' });
      c4.on('roomJoined', resolve);
    });
    console.log(`✓ Player 4 joined, color: ${p4Data.player.color}`);
    if (p4Data.player.color !== 'blue') throw new Error('Expected Player 4 to be blue');

    // 4. Start Game
    console.log('4. Host starting game...');
    const startData = await new Promise((resolve) => {
      c1.emit('startGame', { roomCode });
      c1.on('gameStarted', resolve);
    });
    console.log('✓ Game successfully started, status:', startData.roomState.status);

    // 5. Player 1 rolls dice
    console.log('5. Player 1 (Red) rolling dice...');
    const rollData = await new Promise((resolve) => {
      c1.emit('rollDice', { roomCode });
      c2.on('diceRolled', resolve);
    });
    console.log(`✓ Dice rolled: ${rollData.diceValue}, legal moves: ${JSON.stringify(rollData.legalMoves)}`);

    // 6. Test move if legal moves exist
    if (rollData.legalMoves && rollData.legalMoves.length > 0) {
      console.log('6. Moving token', rollData.legalMoves[0]);
      const moveData = await new Promise((resolve) => {
        c1.emit('moveToken', { roomCode, tokenId: rollData.legalMoves[0] });
        c3.on('tokenMoved', resolve);
      });
      console.log('✓ Token moved successfully across players:', moveData.moveResult.toState);
    } else {
      console.log('6. No legal moves (rolled non-6 from yard), auto-passed to next player:', rollData.nextTurn);
    }

    // 7. Chat test across all players
    console.log('7. Testing synchronized chat...');
    const chatPromise = new Promise((resolve) => {
      c4.on('chatReceived', resolve);
    });
    c1.emit('chatMessage', { roomCode, text: 'Hello from Bharath!' });
    const chatMsg = await chatPromise;
    console.log(`✓ Chat received: [${chatMsg.senderName} (${chatMsg.color})]: ${chatMsg.text}`);

    console.log('\n=============================================');
    console.log('✅ ALL LIVE SYSTEM TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');
  } finally {
    c1.disconnect();
    c2.disconnect();
    c3.disconnect();
    c4.disconnect();
  }
}

runLiveTest().then(() => process.exit(0)).catch(err => {
  console.error('❌ Live test error:', err);
  process.exit(1);
});
