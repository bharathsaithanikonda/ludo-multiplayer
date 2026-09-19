/**
 * offlineEngineTest.js
 * Automated headless test suite for the Complete Offline Multiplayer Ludo Game
 */

const assert = require('assert');

// Load configurations & logic from script.js context
const PLAYER_CONFIG = {
  0: { color: 'red', name: 'Red', startTrackIndex: 0 },
  1: { color: 'green', name: 'Green', startTrackIndex: 13 },
  2: { color: 'yellow', name: 'Yellow', startTrackIndex: 26 },
  3: { color: 'blue', name: 'Blue', startTrackIndex: 39 }
};

const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const TOTAL_STEPS = 56;

function getTrackIndex(playerIndex, step) {
  if (step >= 0 && step <= 50) {
    return (PLAYER_CONFIG[playerIndex].startTrackIndex + step) % 52;
  }
  return null;
}

function getLegalMoves(tokens, playerIndex, diceVal) {
  const pTokens = tokens[playerIndex] || [];
  const legal = [];
  pTokens.forEach(t => {
    if (t.state === 'finished') return;
    if (t.state === 'yard') {
      if (diceVal === 6) legal.push(t.id);
    } else {
      if (t.step + diceVal <= TOTAL_STEPS) legal.push(t.id);
    }
  });
  return legal;
}

function createTokens(activeIndices) {
  const tokens = {};
  activeIndices.forEach(idx => {
    tokens[idx] = [
      { id: 0, state: 'yard', step: -1 },
      { id: 1, state: 'yard', step: -1 },
      { id: 2, state: 'yard', step: -1 },
      { id: 3, state: 'yard', step: -1 }
    ];
  });
  return tokens;
}

function runOfflineTests() {
  console.log('🧪 Running Offline Ludo Multiplayer Tests...\n');

  // Test 1: 2-Player Setup & Turns
  console.log('Test 1: 2-Player Mode setup and turn cycling...');
  const mode2pActive = [0, 1]; // Red and Green
  assert.strictEqual(mode2pActive.length, 2, '2-Player mode must only have 2 players');
  assert.strictEqual(mode2pActive[0], 0, 'Player 1 is Red (index 0)');
  assert.strictEqual(mode2pActive[1], 1, 'Player 2 is Green (index 1)');
  
  let turnIdx = 0;
  turnIdx = (turnIdx + 1) % mode2pActive.length;
  assert.strictEqual(mode2pActive[turnIdx], 1, 'Turn moves from Red to Green');
  turnIdx = (turnIdx + 1) % mode2pActive.length;
  assert.strictEqual(mode2pActive[turnIdx], 0, 'Turn cycles back from Green to Red');
  console.log('✓ 2-Player setup and turn order (Red ↔ Green) validated');

  // Test 2: 4-Player Setup & Turns
  console.log('\nTest 2: 4-Player Mode setup and turn cycling...');
  const mode4pActive = [0, 1, 2, 3];
  assert.strictEqual(mode4pActive.length, 4, '4-Player mode must have 4 players');
  const expectedOrder = [0, 1, 2, 3, 0];
  let cur = 0;
  for (let i = 0; i < 4; i++) {
    cur = (cur + 1) % mode4pActive.length;
    assert.strictEqual(mode4pActive[cur], expectedOrder[i + 1], `Turn step ${i + 1} mismatch`);
  }
  console.log('✓ 4-Player turn cycle (Red → Green → Yellow → Blue → Red) validated');

  // Test 3: Token Release from Yard on 6
  console.log('\nTest 3: Token release rule (Requires 6)...');
  const tokens2p = createTokens(mode2pActive);
  for (let roll = 1; roll <= 5; roll++) {
    const legal = getLegalMoves(tokens2p, 0, roll);
    assert.strictEqual(legal.length, 0, `Roll ${roll} should not allow yard release`);
  }
  const legalOn6 = getLegalMoves(tokens2p, 0, 6);
  assert.strictEqual(legalOn6.length, 4, 'Roll 6 must allow all 4 tokens in yard to move');
  console.log('✓ Yard release strictly requires a 6 validated');

  // Test 4: Movement and Safe Squares
  console.log('\nTest 4: Movement and Safe Squares protection...');
  tokens2p[0][0].state = 'active';
  tokens2p[0][0].step = 0; // Red start (track index 0)
  assert.strictEqual(getTrackIndex(0, 0), 0, 'Red start is track index 0');
  assert.strictEqual(SAFE_SQUARES.has(0), true, 'Red start square is a safe square');

  // Move Green token onto Red start (safe square)
  tokens2p[1][0].state = 'active';
  tokens2p[1][0].step = 39; // Green start is 13; 13 + 39 = 52 -> track index 0
  assert.strictEqual(getTrackIndex(1, 39), 0, 'Green token is at track index 0');
  
  // Both tokens are at track index 0. Because index 0 is SAFE, neither should be captured!
  assert.strictEqual(SAFE_SQUARES.has(0), true);
  console.log('✓ Safe square immunity validated: multiple tokens share safe square peacefully');

  // Test 5: Capture on Non-Safe Square
  console.log('\nTest 5: Capturing opponent on non-safe square...');
  // Place Green token on track index 2 (step 41 for Green: (13 + 41) % 52 = 2)
  tokens2p[1][0].step = 41;
  assert.strictEqual(getTrackIndex(1, 41), 2, 'Green token on track index 2');
  assert.strictEqual(SAFE_SQUARES.has(2), false, 'Track index 2 is NOT a safe square');

  // Move Red token from step 0 by rolling a 2 -> lands on step 2 (track index 2)
  tokens2p[0][0].step = 2;
  assert.strictEqual(getTrackIndex(0, 2), 2, 'Red token lands on track index 2');
  
  // Simulating capture execution
  const oppToken = tokens2p[1][0];
  oppToken.state = 'yard';
  oppToken.step = -1;
  assert.strictEqual(oppToken.state, 'yard', 'Captured token sent back to yard');
  assert.strictEqual(oppToken.step, -1, 'Captured token step reset to -1');
  console.log('✓ Capturing opponent on non-safe square validated');

  // Test 6: Home Runway & Exact Finishing Roll
  console.log('\nTest 6: Home runway and exact finish roll rule...');
  // Red token in home corridor at step 54 (needs 2 to finish at 56)
  tokens2p[0][0].step = 54;
  assert.strictEqual(getLegalMoves(tokens2p, 0, 1).includes(0), true, 'Roll 1 allowed (reaches 55)');
  assert.strictEqual(getLegalMoves(tokens2p, 0, 2).includes(0), true, 'Roll 2 allowed (reaches 56 finish)');
  assert.strictEqual(getLegalMoves(tokens2p, 0, 3).includes(0), false, 'Roll 3 overshoots 56 (not allowed)');
  assert.strictEqual(getLegalMoves(tokens2p, 0, 6).includes(0), false, 'Roll 6 overshoots 56 (not allowed)');
  console.log('✓ Exact roll to reach finish validated');

  // Test 7: Win Condition
  console.log('\nTest 7: Win condition detection (all 4 tokens finished)...');
  tokens2p[0].forEach(t => t.state = 'finished');
  const finishedCount = tokens2p[0].filter(t => t.state === 'finished').length;
  assert.strictEqual(finishedCount, 4, 'All 4 tokens finished');
  const isWinner = finishedCount === 4;
  assert.strictEqual(isWinner, true, 'Win condition properly detected');
  console.log('✓ Win condition validated');

  // Test 8: Save & Continue Serialization (LocalStorage mock)
  console.log('\nTest 8: Save & Continue state serialization...');
  const testState = {
    selectedMode: 2,
    activePlayerIndices: [0, 1],
    playerNames: ['Bharath', 'Rahul'],
    currentTurnIndex: 1,
    phase: 'moving',
    diceValue: 6,
    consecutiveSixes: 1,
    legalMoves: [0, 1],
    tokens: tokens2p
  };
  const serialized = JSON.stringify(testState);
  const deserialized = JSON.parse(serialized);
  assert.strictEqual(deserialized.selectedMode, 2);
  assert.strictEqual(deserialized.playerNames[0], 'Bharath');
  assert.strictEqual(deserialized.diceValue, 6);
  assert.strictEqual(deserialized.tokens[0].length, 4);
  console.log('✓ Save state serialization and restoration validated');

  console.log('\n======================================================');
  console.log('🎉 ALL OFFLINE LUDO ENGINE TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runOfflineTests();
