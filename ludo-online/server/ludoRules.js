/**
 * ludoRules.js - Authoritative Ludo Rules & Coordinate Mapping
 * 
 * Standard 15x15 Ludo Board track with:
 * - 52 global perimeter track squares (indices 0 to 51)
 * - 8 safe squares (4 starts + 4 stars)
 * - 4 colored 5-step home paths leading to the center finish
 * - Turn handling, 6-bonus, capture-bonus, and exact finish rules
 */

const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'];

const PLAYER_CONFIG = {
  0: {
    color: 'red',
    name: 'Red',
    startTrackIndex: 0,
    homeEntranceTrackIndex: 50, // Square right before turning into home
    yardCoords: [
      { r: 2, c: 2 },
      { r: 2, c: 3 },
      { r: 3, c: 2 },
      { r: 3, c: 3 }
    ],
    homePathCoords: [
      { r: 7, c: 1 },
      { r: 7, c: 2 },
      { r: 7, c: 3 },
      { r: 7, c: 4 },
      { r: 7, c: 5 }
    ],
    finishCoord: { r: 7, c: 6 }
  },
  1: {
    color: 'green',
    name: 'Green',
    startTrackIndex: 13,
    homeEntranceTrackIndex: 11,
    yardCoords: [
      { r: 2, c: 11 },
      { r: 2, c: 12 },
      { r: 3, c: 11 },
      { r: 3, c: 12 }
    ],
    homePathCoords: [
      { r: 1, c: 7 },
      { r: 2, c: 7 },
      { r: 3, c: 7 },
      { r: 4, c: 7 },
      { r: 5, c: 7 }
    ],
    finishCoord: { r: 6, c: 7 }
  },
  2: {
    color: 'yellow',
    name: 'Yellow',
    startTrackIndex: 26,
    homeEntranceTrackIndex: 24,
    yardCoords: [
      { r: 11, c: 11 },
      { r: 11, c: 12 },
      { r: 12, c: 11 },
      { r: 12, c: 12 }
    ],
    homePathCoords: [
      { r: 7, c: 13 },
      { r: 7, c: 12 },
      { r: 7, c: 11 },
      { r: 7, c: 10 },
      { r: 7, c: 9 }
    ],
    finishCoord: { r: 7, c: 8 }
  },
  3: {
    color: 'blue',
    name: 'Blue',
    startTrackIndex: 39,
    homeEntranceTrackIndex: 37,
    yardCoords: [
      { r: 11, c: 2 },
      { r: 11, c: 3 },
      { r: 12, c: 2 },
      { r: 12, c: 3 }
    ],
    homePathCoords: [
      { r: 13, c: 7 },
      { r: 12, c: 7 },
      { r: 11, c: 7 },
      { r: 10, c: 7 },
      { r: 9, c: 7 }
    ],
    finishCoord: { r: 8, c: 7 }
  }
};

// 52 Perimeter Track Coordinates [0..51] in clockwise order
const TRACK_COORDS = [
  /* 0 - Red Start */  { r: 6, c: 1 },
  /* 1 */              { r: 6, c: 2 },
  /* 2 */              { r: 6, c: 3 },
  /* 3 */              { r: 6, c: 4 },
  /* 4 */              { r: 6, c: 5 },
  /* 5 */              { r: 5, c: 6 },
  /* 6 */              { r: 4, c: 6 },
  /* 7 */              { r: 3, c: 6 },
  /* 8 - Safe Star */  { r: 2, c: 6 },
  /* 9 */              { r: 1, c: 6 },
  /* 10 */             { r: 0, c: 6 },
  /* 11 */             { r: 0, c: 7 },
  /* 12 */             { r: 0, c: 8 },
  /* 13 - Green Start*/{ r: 1, c: 8 },
  /* 14 */             { r: 2, c: 8 },
  /* 15 */             { r: 3, c: 8 },
  /* 16 */             { r: 4, c: 8 },
  /* 17 */             { r: 5, c: 8 },
  /* 18 */             { r: 6, c: 9 },
  /* 19 */             { r: 6, c: 10 },
  /* 20 */             { r: 6, c: 11 },
  /* 21 - Safe Star */ { r: 6, c: 12 },
  /* 22 */             { r: 6, c: 13 },
  /* 23 */             { r: 6, c: 14 },
  /* 24 */             { r: 7, c: 14 },
  /* 25 */             { r: 8, c: 14 },
  /* 26 - Yellow Start*/{ r: 8, c: 13 },
  /* 27 */             { r: 8, c: 12 },
  /* 28 */             { r: 8, c: 11 },
  /* 29 */             { r: 8, c: 10 },
  /* 30 */             { r: 8, c: 9 },
  /* 31 */             { r: 9, c: 8 },
  /* 32 */             { r: 10, c: 8 },
  /* 33 */             { r: 11, c: 8 },
  /* 34 - Safe Star */ { r: 12, c: 8 },
  /* 35 */             { r: 13, c: 8 },
  /* 36 */             { r: 14, c: 8 },
  /* 37 */             { r: 14, c: 7 },
  /* 38 */             { r: 14, c: 6 },
  /* 39 - Blue Start */{ r: 13, c: 6 },
  /* 40 */             { r: 12, c: 6 },
  /* 41 */             { r: 11, c: 6 },
  /* 42 */             { r: 10, c: 6 },
  /* 43 */             { r: 9, c: 6 },
  /* 44 */             { r: 8, c: 5 },
  /* 45 */             { r: 8, c: 4 },
  /* 46 */             { r: 8, c: 3 },
  /* 47 - Safe Star */ { r: 8, c: 2 },
  /* 48 */             { r: 8, c: 1 },
  /* 49 */             { r: 8, c: 0 },
  /* 50 */             { r: 7, c: 0 },
  /* 51 */             { r: 6, c: 0 }
];

// 8 Safe Squares (cannot be captured here)
const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Steps details:
// step 0: token on starting square (e.g. Red track index 0)
// step 0..50: 51 steps on perimeter track
// step 51..55: 5 steps in colored home path
// step 56: Center finishing triangle (GOAL!)
const TOTAL_STEPS_TO_FINISH = 56;

/**
 * Returns coordinate for a token given its player index, state, and step.
 */
function getTokenCoordinate(playerIndex, tokenId, state, step) {
  const cfg = PLAYER_CONFIG[playerIndex];
  if (!cfg) return null;

  if (state === 'yard' || step < 0) {
    return cfg.yardCoords[tokenId];
  }

  if (state === 'finished' || step >= TOTAL_STEPS_TO_FINISH) {
    return cfg.finishCoord;
  }

  // On perimeter track
  if (step <= 50) {
    const trackIndex = (cfg.startTrackIndex + step) % 52;
    return TRACK_COORDS[trackIndex];
  }

  // In home path
  const homePathIndex = step - 51; // 0..4
  if (homePathIndex < cfg.homePathCoords.length) {
    return cfg.homePathCoords[homePathIndex];
  }

  return cfg.finishCoord;
}

/**
 * Get global track index for a token if on perimeter track, else null
 */
function getTrackIndex(playerIndex, step) {
  if (step >= 0 && step <= 50) {
    const cfg = PLAYER_CONFIG[playerIndex];
    return (cfg.startTrackIndex + step) % 52;
  }
  return null;
}

/**
 * Creates initial tokens for 4 players (each has 4 tokens)
 */
function createInitialTokens() {
  const tokens = {};
  for (let p = 0; p < 4; p++) {
    tokens[p] = [
      { id: 0, state: 'yard', step: -1 },
      { id: 1, state: 'yard', step: -1 },
      { id: 2, state: 'yard', step: -1 },
      { id: 3, state: 'yard', step: -1 }
    ];
  }
  return tokens;
}

/**
 * Validates whether a token can legally move given the rolled dice value.
 */
function canMoveToken(playerIndex, token, diceValue) {
  if (token.state === 'finished') {
    return false;
  }

  // Token is in yard
  if (token.state === 'yard') {
    // Only a 6 can bring a token out of the yard
    return diceValue === 6;
  }

  // Token is active on board
  const newStep = token.step + diceValue;
  // Cannot overshoot the finish line (must land exactly on 56)
  return newStep <= TOTAL_STEPS_TO_FINISH;
}

/**
 * Returns array of token IDs that can legally move.
 */
function getLegalMoves(playerIndex, tokens, diceValue) {
  const playerTokens = tokens[playerIndex];
  if (!playerTokens) return [];

  const legal = [];
  for (const token of playerTokens) {
    if (canMoveToken(playerIndex, token, diceValue)) {
      legal.push(token.id);
    }
  }
  return legal;
}

/**
 * Calculates step-by-step intermediate coordinates for animation.
 */
function calculatePathSteps(playerIndex, tokenId, fromState, fromStep, toStep) {
  const steps = [];
  if (fromState === 'yard') {
    // Exiting yard to start square (step 0)
    steps.push(getTokenCoordinate(playerIndex, tokenId, 'active', 0));
    return steps;
  }

  for (let s = fromStep + 1; s <= toStep; s++) {
    const st = s === TOTAL_STEPS_TO_FINISH ? 'finished' : 'active';
    steps.push(getTokenCoordinate(playerIndex, tokenId, st, s));
  }
  return steps;
}

/**
 * Executes a move on the authoritative game state.
 * Returns move result including captures, bonuses, and next turn info.
 */
function executeMove(gameState, playerIndex, tokenId, diceValue) {
  const playerTokens = gameState.tokens[playerIndex];
  const token = playerTokens ? playerTokens.find(t => t.id === tokenId) : null;

  if (!token) {
    return { success: false, error: 'Token not found' };
  }

  if (!canMoveToken(playerIndex, token, diceValue)) {
    return { success: false, error: 'Illegal move' };
  }

  const fromState = token.state;
  const fromStep = token.step;
  let toStep;
  let toState;

  if (fromState === 'yard') {
    toStep = 0;
    toState = 'active';
  } else {
    toStep = fromStep + diceValue;
    toState = toStep === TOTAL_STEPS_TO_FINISH ? 'finished' : 'active';
  }

  // Calculate coordinates along path for smooth client animation
  const pathCoordinates = calculatePathSteps(playerIndex, tokenId, fromState, fromStep, toStep);

  // Apply token position update
  token.step = toStep;
  token.state = toState;

  let capturedToken = null;
  let isFinish = false;
  let extraTurn = false;

  // Check capture if token lands on perimeter track
  if (toState === 'active' && toStep <= 50) {
    const targetTrackIndex = getTrackIndex(playerIndex, toStep);
    
    // Captures only occur on non-safe squares
    if (targetTrackIndex !== null && !SAFE_SQUARES.has(targetTrackIndex)) {
      // Look for opponent tokens on this exact track square
      for (const [oppIdxStr, oppTokens] of Object.entries(gameState.tokens)) {
        const oppIndex = parseInt(oppIdxStr, 10);
        if (oppIndex === playerIndex) continue; // Friendly tokens do not capture

        for (const oppToken of oppTokens) {
          if (oppToken.state === 'active' && oppToken.step <= 50) {
            const oppTrackIndex = getTrackIndex(oppIndex, oppToken.step);
            if (oppTrackIndex === targetTrackIndex) {
              // Capture occurred!
              oppToken.state = 'yard';
              oppToken.step = -1;
              capturedToken = {
                playerIndex: oppIndex,
                tokenId: oppToken.id,
                yardCoord: PLAYER_CONFIG[oppIndex].yardCoords[oppToken.id]
              };
              extraTurn = true; // Capturing grants an extra roll
              break;
            }
          }
        }
        if (capturedToken) break;
      }
    }
  }

  // Check if token finished
  if (toState === 'finished') {
    isFinish = true;
    extraTurn = true; // Finishing a token grants an extra roll
  }

  // Rolling a 6 also grants an extra turn
  if (diceValue === 6 && gameState.consecutiveSixes < 3) {
    extraTurn = true;
  }

  // Check win condition: all 4 tokens finished
  const finishedCount = playerTokens.filter(t => t.state === 'finished').length;
  const isWinner = finishedCount === 4;

  return {
    success: true,
    playerIndex,
    tokenId,
    fromState,
    fromStep,
    toState,
    toStep,
    pathCoordinates,
    capturedToken,
    isFinish,
    extraTurn,
    isWinner
  };
}

module.exports = {
  PLAYER_COLORS,
  PLAYER_CONFIG,
  TRACK_COORDS,
  SAFE_SQUARES,
  TOTAL_STEPS_TO_FINISH,
  getTokenCoordinate,
  getTrackIndex,
  createInitialTokens,
  canMoveToken,
  getLegalMoves,
  calculatePathSteps,
  executeMove
};
