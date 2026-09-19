/**
 * script.js - Complete Offline Multiplayer Ludo Game
 * 100% Offline • Zero External Dependencies • Human vs Human Pass-and-Play
 * Supports 2-Player (Red vs Green) and 4-Player (Red, Green, Yellow, Blue) modes.
 */

// ============================================================================
// 1. PROCEDURAL WEB AUDIO SYNTHESIZER (100% OFFLINE, ZERO EXTERNAL FILES)
// ============================================================================
class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('ludo_offline_sound') !== 'false';
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('ludo_offline_sound', this.enabled);
    return this.enabled;
  }

  // Dice tumbling roll sound
  playDiceRoll() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160 + Math.random() * 200, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      }, i * 75);
    }
  }

  // Crisp token hop/step
  playStep() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(460, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Resonant capture impact
  playCapture() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  // Safe square arrival chime
  playSafe() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    [587.33, 880].forEach((freq, idx) => {
      setTimeout(() => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
      }, idx * 100);
    });
  }

  // Token finished fanfare
  playFinish() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
      }, idx * 90);
    });
  }

  // Grand victory celebration chords
  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.00],
      [659.25, 830.61, 987.77],
      [783.99, 987.77, 1174.66, 1567.98]
    ];
    chords.forEach((chord, i) => {
      setTimeout(() => {
        chord.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (i === 3 ? 1.0 : 0.4));
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + (i === 3 ? 1.0 : 0.4));
        });
      }, i * 220);
    });
  }
}

const sounds = new AudioSynthesizer();

// ============================================================================
// 2. COORDINATE MAPPINGS & RULES CONFIGURATION
// ============================================================================
const PLAYER_CONFIG = {
  0: {
    color: 'red',
    name: 'Red',
    label: 'R',
    badge: '🔴',
    startCoord: { r: 6, c: 1 },
    startTrackIndex: 0,
    yardCoords: [
      { r: 2, c: 2 }, { r: 2, c: 3 },
      { r: 3, c: 2 }, { r: 3, c: 3 }
    ],
    homePathCoords: [
      { r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }
    ],
    finishCoord: { r: 7, c: 6 }
  },
  1: {
    color: 'green',
    name: 'Green',
    label: 'G',
    badge: '🟢',
    startCoord: { r: 1, c: 8 },
    startTrackIndex: 13,
    yardCoords: [
      { r: 2, c: 11 }, { r: 2, c: 12 },
      { r: 3, c: 11 }, { r: 3, c: 12 }
    ],
    homePathCoords: [
      { r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }
    ],
    finishCoord: { r: 6, c: 7 }
  },
  2: {
    color: 'yellow',
    name: 'Yellow',
    label: 'Y',
    badge: '🟡',
    startCoord: { r: 8, c: 13 },
    startTrackIndex: 26,
    yardCoords: [
      { r: 11, c: 11 }, { r: 11, c: 12 },
      { r: 12, c: 11 }, { r: 12, c: 12 }
    ],
    homePathCoords: [
      { r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }
    ],
    finishCoord: { r: 7, c: 8 }
  },
  3: {
    color: 'blue',
    name: 'Blue',
    label: 'B',
    badge: '🔵',
    startCoord: { r: 13, c: 6 },
    startTrackIndex: 39,
    yardCoords: [
      { r: 11, c: 2 }, { r: 11, c: 3 },
      { r: 12, c: 2 }, { r: 12, c: 3 }
    ],
    homePathCoords: [
      { r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }
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

// 8 Safe Squares on Track
const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const TOTAL_STEPS = 56;

function getTokenCoordinate(playerIndex, tokenId, state, step) {
  const cfg = PLAYER_CONFIG[playerIndex];
  if (!cfg) return null;

  if (state === 'yard' || step < 0) {
    return cfg.yardCoords[tokenId];
  }
  if (state === 'finished' || step >= TOTAL_STEPS) {
    return cfg.finishCoord;
  }
  if (step <= 50) {
    const trackIndex = (cfg.startTrackIndex + step) % 52;
    return TRACK_COORDS[trackIndex];
  }
  const homeIdx = step - 51;
  return cfg.homePathCoords[homeIdx] || cfg.finishCoord;
}

function getTrackIndex(playerIndex, step) {
  if (step >= 0 && step <= 50) {
    const cfg = PLAYER_CONFIG[playerIndex];
    return (cfg.startTrackIndex + step) % 52;
  }
  return null;
}

// ============================================================================
// 3. OFFLINE LUDO GAME CONTROLLER
// ============================================================================
class OfflineLudoGame {
  constructor() {
    this.selectedMode = 2; // 2 or 4 players
    this.activePlayerIndices = [0, 1]; // [0, 1] for 2p, [0, 1, 2, 3] for 4p
    this.playerNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
    
    // Game State
    this.currentTurnIndex = 0; // index in activePlayerIndices
    this.phase = 'rolling'; // 'rolling' | 'moving' | 'finished'
    this.diceValue = null;
    this.consecutiveSixes = 0;
    this.legalMoves = [];
    this.tokens = {};
    this.winner = null;
    this.isAnimating = false;

    // DOM Elements
    this.dom = {
      viewStart: document.getElementById('view-start'),
      viewGame: document.getElementById('view-game'),
      
      // Start Screen
      btnContinueGame: document.getElementById('btn-continue-game'),
      continueSection: document.getElementById('continue-section'),
      btnMode2p: document.getElementById('btn-mode-2p'),
      btnMode4p: document.getElementById('btn-mode-4p'),
      cardP3: document.getElementById('card-p3'),
      cardP4: document.getElementById('card-p4'),
      inputP1: document.getElementById('input-p1'),
      inputP2: document.getElementById('input-p2'),
      inputP3: document.getElementById('input-p3'),
      inputP4: document.getElementById('input-p4'),
      btnStartGame: document.getElementById('btn-start-game'),
      btnOpenRules: document.getElementById('btn-open-rules'),

      // Game Header
      pillModeText: document.getElementById('pill-mode-text'),
      turnDot: document.getElementById('turn-dot'),
      turnStatusText: document.getElementById('turn-status-text'),
      btnSoundGame: document.getElementById('btn-sound-game'),
      btnRulesGame: document.getElementById('btn-rules-game'),
      btnRestartGame: document.getElementById('btn-restart-game'),
      btnExitMenu: document.getElementById('btn-exit-menu'),

      // Board & Dashboard
      ludoBoard: document.getElementById('ludo-board'),
      playersListPanel: document.getElementById('players-list-panel'),
      diceCube: document.getElementById('dice-cube'),
      btnRollDice: document.getElementById('btn-roll-dice'),
      diceMessage: document.getElementById('dice-message'),
      btnSubNewGame: document.getElementById('btn-sub-new-game'),
      btnSubRestart: document.getElementById('btn-sub-restart'),
      btnSubMenu: document.getElementById('btn-sub-menu'),

      // Modals
      modalRules: document.getElementById('modal-rules'),
      btnCloseRules: document.getElementById('btn-close-rules'),
      btnRulesOk: document.getElementById('btn-rules-ok'),
      modalWinner: document.getElementById('modal-winner'),
      winnerName: document.getElementById('winner-name'),
      btnWinnerNewGame: document.getElementById('btn-winner-new-game'),
      btnWinnerExit: document.getElementById('btn-winner-exit'),

      // Toast
      eventToast: document.getElementById('event-toast'),
      toastText: document.getElementById('toast-text'),
      toastIcon: document.getElementById('toast-icon')
    };

    this.init();
  }

  init() {
    this.buildBoardGrid();
    this.bindEvents();
    this.updateSoundButtons();
    this.checkSavedGame();
  }

  // ==========================================================================
  // 4. BOARD GRID GENERATION (15x15)
  // ==========================================================================
  buildBoardGrid() {
    const board = this.dom.ludoBoard;
    board.innerHTML = '';

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.id = `cell-${r}-${c}`;

        // 1. Red Base (Top-Left: 6x6)
        if (r < 6 && c < 6) {
          if (r === 0 && c === 0) {
            cell.className += ' home-base base-red';
            cell.id = 'base-red';
            cell.style.gridArea = '1 / 1 / 7 / 7';
            cell.innerHTML = `
              <div class="home-base-inner">
                <div class="yard-pocket"><div class="tokens-container" id="tc-2-2"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-2-3"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-3-2"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-3-3"></div></div>
              </div>
            `;
          } else continue;
        } 
        // 2. Green Base (Top-Right: 6x6)
        else if (r < 6 && c >= 9) {
          if (r === 0 && c === 9) {
            cell.className += ' home-base base-green';
            cell.id = 'base-green';
            cell.style.gridArea = '1 / 10 / 7 / 16';
            cell.innerHTML = `
              <div class="home-base-inner">
                <div class="yard-pocket"><div class="tokens-container" id="tc-2-11"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-2-12"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-3-11"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-3-12"></div></div>
              </div>
            `;
          } else continue;
        } 
        // 3. Yellow Base (Bottom-Right: 6x6)
        else if (r >= 9 && c >= 9) {
          if (r === 9 && c === 9) {
            cell.className += ' home-base base-yellow';
            cell.id = 'base-yellow';
            cell.style.gridArea = '10 / 10 / 16 / 16';
            cell.innerHTML = `
              <div class="home-base-inner">
                <div class="yard-pocket"><div class="tokens-container" id="tc-11-11"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-11-12"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-12-11"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-12-12"></div></div>
              </div>
            `;
          } else continue;
        } 
        // 4. Blue Base (Bottom-Left: 6x6)
        else if (r >= 9 && c < 6) {
          if (r === 9 && c === 0) {
            cell.className += ' home-base base-blue';
            cell.id = 'base-blue';
            cell.style.gridArea = '10 / 1 / 16 / 7';
            cell.innerHTML = `
              <div class="home-base-inner">
                <div class="yard-pocket"><div class="tokens-container" id="tc-11-2"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-11-3"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-12-2"></div></div>
                <div class="yard-pocket"><div class="tokens-container" id="tc-12-3"></div></div>
              </div>
            `;
          } else continue;
        } 
        // 5. Center 3x3 Finishing Zone
        else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
          if (r === 6 && c === 6) {
            cell.className += ' center-finish-zone';
            cell.style.gridArea = '7 / 7 / 10 / 10';
            cell.innerHTML = `
              <div class="center-triangle tri-top"><div class="tokens-container" id="tc-6-7"></div></div>
              <div class="center-triangle tri-right"><div class="tokens-container" id="tc-7-8"></div></div>
              <div class="center-triangle tri-bottom"><div class="tokens-container" id="tc-8-7"></div></div>
              <div class="center-triangle tri-left"><div class="tokens-container" id="tc-7-6"></div></div>
              <div class="center-crown">👑</div>
            `;
          } else continue;
        } 
        // 6. Perimeter Track Cells & Colored Home Runways
        else {
          const tc = document.createElement('div');
          tc.className = 'tokens-container';
          tc.id = `tc-${r}-${c}`;
          cell.appendChild(tc);

          // Home paths
          if (r === 7 && c >= 1 && c <= 5) cell.classList.add('cell-red-path');
          else if (c === 7 && r >= 1 && r <= 5) cell.classList.add('cell-green-path');
          else if (r === 7 && c >= 9 && c <= 13) cell.classList.add('cell-yellow-path');
          else if (c === 7 && r >= 9 && r <= 13) cell.classList.add('cell-blue-path');

          // Starts
          if (r === 6 && c === 1) cell.classList.add('cell-red-start');
          if (r === 1 && c === 8) cell.classList.add('cell-green-start');
          if (r === 8 && c === 13) cell.classList.add('cell-yellow-start');
          if (r === 13 && c === 6) cell.classList.add('cell-blue-start');

          // Safe Stars
          const isStar = (r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2);
          if (isStar || (r === 6 && c === 1) || (r === 1 && c === 8) || (r === 8 && c === 13) || (r === 13 && c === 6)) {
            cell.classList.add('cell-safe');
          }
        }

        board.appendChild(cell);
      }
    }
  }

  // ==========================================================================
  // 5. INITIALIZATION & STATE MANAGEMENT
  // ==========================================================================
  startNewGame(mode, names = null) {
    this.selectedMode = mode;
    this.activePlayerIndices = mode === 2 ? [0, 1] : [0, 1, 2, 3];

    if (names) {
      this.playerNames = names;
    } else {
      this.playerNames = [
        this.dom.inputP1.value.trim() || 'Player 1',
        this.dom.inputP2.value.trim() || 'Player 2',
        this.dom.inputP3.value.trim() || 'Player 3',
        this.dom.inputP4.value.trim() || 'Player 4'
      ];
    }

    // Initialize tokens
    this.tokens = {};
    this.activePlayerIndices.forEach(pIdx => {
      this.tokens[pIdx] = [
        { id: 0, state: 'yard', step: -1 },
        { id: 1, state: 'yard', step: -1 },
        { id: 2, state: 'yard', step: -1 },
        { id: 3, state: 'yard', step: -1 }
      ];
    });

    this.currentTurnIndex = 0; // Red starts
    this.phase = 'rolling';
    this.diceValue = null;
    this.consecutiveSixes = 0;
    this.legalMoves = [];
    this.winner = null;
    this.isAnimating = false;

    this.applyModeVisuals();
    this.switchView('game');
    this.renderGame();
    this.saveState();
  }

  restartCurrentMatch() {
    this.startNewGame(this.selectedMode, this.playerNames);
    this.showToast('Match restarted!', '🔄');
  }

  applyModeVisuals() {
    const is2p = this.selectedMode === 2;
    this.dom.pillModeText.textContent = is2p ? '2 PLAYERS (RED & GREEN)' : '4 PLAYERS';

    // Yellow & Blue bases styling
    const yellowBase = document.getElementById('base-yellow');
    const blueBase = document.getElementById('base-blue');

    if (yellowBase) yellowBase.classList.toggle('base-inactive', is2p);
    if (blueBase) blueBase.classList.toggle('base-inactive', is2p);

    // Dim yellow and blue home paths in 2-player mode
    document.querySelectorAll('.cell-yellow-path, .cell-blue-path').forEach(el => {
      el.classList.toggle('cell-inactive-path', is2p);
    });
  }

  switchView(viewName) {
    if (viewName === 'start') {
      this.dom.viewStart.classList.add('active');
      this.dom.viewStart.classList.remove('hidden');
      this.dom.viewGame.classList.remove('active');
      this.dom.viewGame.classList.add('hidden');
      this.checkSavedGame();
    } else {
      this.dom.viewGame.classList.add('active');
      this.dom.viewGame.classList.remove('hidden');
      this.dom.viewStart.classList.remove('active');
      this.dom.viewStart.classList.add('hidden');
    }
  }

  // ==========================================================================
  // 6. RENDERING & UI UPDATES
  // ==========================================================================
  renderGame() {
    const activePlayerIndex = this.activePlayerIndices[this.currentTurnIndex];
    const cfg = PLAYER_CONFIG[activePlayerIndex];
    const activePlayerName = this.playerNames[activePlayerIndex];

    // 1. Turn Banner
    this.dom.turnDot.style.background = `var(--color-${cfg.color})`;
    if (this.phase === 'rolling') {
      this.dom.turnStatusText.textContent = `${cfg.badge} ${activePlayerName}'s Turn (Roll Dice!)`;
      this.dom.diceMessage.textContent = `${activePlayerName}: Roll the dice!`;
      this.dom.btnRollDice.disabled = false;
      this.dom.btnRollDice.classList.add('btn-glow');
    } else if (this.phase === 'moving') {
      this.dom.turnStatusText.textContent = `${cfg.badge} ${activePlayerName}: Tap a glowing token`;
      this.dom.diceMessage.textContent = `Rolled a ${this.diceValue}! Select token to move.`;
      this.dom.btnRollDice.disabled = true;
      this.dom.btnRollDice.classList.remove('btn-glow');
    }

    // 2. Dice Cube Face
    if (this.diceValue) {
      this.dom.diceCube.dataset.value = this.diceValue;
    }

    // 3. Player Cards in Dashboard
    this.renderPlayerCards();

    // 4. Tokens on Board
    this.renderTokens();
  }

  renderPlayerCards() {
    this.dom.playersListPanel.innerHTML = '';
    const currentActiveIndex = this.activePlayerIndices[this.currentTurnIndex];

    this.activePlayerIndices.forEach(pIdx => {
      const cfg = PLAYER_CONFIG[pIdx];
      const pName = this.playerNames[pIdx];
      const isTurn = pIdx === currentActiveIndex;

      // Count finished tokens
      const pTokens = this.tokens[pIdx] || [];
      const finishedCount = pTokens.filter(t => t.state === 'finished').length;

      const card = document.createElement('div');
      card.className = `player-status-card card-${cfg.color} ${isTurn ? 'active-turn' : ''}`;
      card.innerHTML = `
        <div class="card-info-left">
          <div class="player-avatar-badge">${cfg.badge}</div>
          <div class="player-meta-wrap">
            <span class="player-card-name">${this.escapeHtml(pName)}</span>
            <span class="player-card-sub">${isTurn ? 'Active Turn' : cfg.name}</span>
          </div>
        </div>
        <div class="card-info-right">
          <div class="finished-tokens-badge" title="Tokens Home">
            <span>🏁</span> ${finishedCount}/4
          </div>
        </div>
      `;
      this.dom.playersListPanel.appendChild(card);
    });
  }

  renderTokens() {
    // Clear all token containers
    document.querySelectorAll('.tokens-container').forEach(tc => {
      tc.innerHTML = '';
      tc.classList.remove('multi-tokens');
    });

    const currentActiveIndex = this.activePlayerIndices[this.currentTurnIndex];
    const canMove = this.phase === 'moving' && !this.isAnimating;

    const cellTokenMap = new Map();

    // Map all active tokens to coordinates
    this.activePlayerIndices.forEach(pIdx => {
      const pTokens = this.tokens[pIdx] || [];
      const cfg = PLAYER_CONFIG[pIdx];

      pTokens.forEach(token => {
        const coord = getTokenCoordinate(pIdx, token.id, token.state, token.step);
        if (!coord) return;

        const key = `${coord.r}-${coord.c}`;
        if (!cellTokenMap.has(key)) cellTokenMap.set(key, []);
        cellTokenMap.get(key).push({ playerIndex: pIdx, token, cfg });
      });
    });

    // Render onto board
    for (const [key, group] of cellTokenMap.entries()) {
      const tc = document.getElementById(`tc-${key}`);
      if (!tc) continue;

      if (group.length > 1) {
        tc.classList.add('multi-tokens');
      }

      group.forEach(({ playerIndex, token, cfg }) => {
        const tokenElem = document.createElement('div');
        tokenElem.className = `ludo-token token-${cfg.color}`;
        tokenElem.textContent = `${cfg.label}${token.id + 1}`;
        tokenElem.id = `token-${playerIndex}-${token.id}`;

        const isLegal = canMove && playerIndex === currentActiveIndex && this.legalMoves.includes(token.id);
        if (isLegal) {
          tokenElem.classList.add('legal-move');
          tokenElem.title = 'Click to move this token!';
          tokenElem.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleTokenClick(token.id);
          });
        }

        tc.appendChild(tokenElem);
      });
    }
  }

  // ==========================================================================
  // 7. GAMEPLAY ACTIONS (ROLL, MOVE, CAPTURE, FINISH)
  // ==========================================================================
  handleRollDice() {
    if (this.phase !== 'rolling' || this.isAnimating) return;

    this.isAnimating = true;
    sounds.playDiceRoll();

    // 3D rolling animation
    const dice = this.dom.diceCube;
    dice.classList.add('rolling');
    this.dom.btnRollDice.disabled = true;

    // Authoritative random roll (1 to 6)
    const rolledVal = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      dice.classList.remove('rolling');
      dice.dataset.value = rolledVal;
      this.diceValue = rolledVal;
      this.isAnimating = false;

      // Handle 6s tracking
      if (rolledVal === 6) {
        this.consecutiveSixes += 1;
      } else {
        this.consecutiveSixes = 0;
      }

      // 3 consecutive 6s rule
      if (this.consecutiveSixes >= 3) {
        this.showToast('Three 6s rolled! Turn forfeited.', '❌');
        this.consecutiveSixes = 0;
        this.advanceTurn();
        return;
      }

      // Determine legal moves
      const activePIdx = this.activePlayerIndices[this.currentTurnIndex];
      this.legalMoves = this.getLegalMoves(activePIdx, rolledVal);

      if (this.legalMoves.length === 0) {
        this.showToast('No legal moves! Passing turn.', '⏩');
        setTimeout(() => {
          this.advanceTurn();
        }, 1100);
      } else {
        if (rolledVal === 6) {
          this.showToast('Rolled a 6! Extra roll granted 🎲', '🔥');
        }
        this.phase = 'moving';
        this.renderGame();
      }
      this.saveState();
    }, 750);
  }

  getLegalMoves(playerIndex, diceVal) {
    const playerTokens = this.tokens[playerIndex] || [];
    const legal = [];

    playerTokens.forEach(token => {
      if (token.state === 'finished') return;

      if (token.state === 'yard') {
        if (diceVal === 6) legal.push(token.id);
      } else {
        const targetStep = token.step + diceVal;
        if (targetStep <= TOTAL_STEPS) {
          legal.push(token.id);
        }
      }
    });

    return legal;
  }

  async handleTokenClick(tokenId) {
    if (this.phase !== 'moving' || this.isAnimating) return;
    if (!this.legalMoves.includes(tokenId)) return;

    this.isAnimating = true;
    const activePIdx = this.activePlayerIndices[this.currentTurnIndex];
    const playerTokens = this.tokens[activePIdx];
    const token = playerTokens.find(t => t.id === tokenId);
    if (!token) return;

    const fromState = token.state;
    const fromStep = token.step;
    let toStep;
    let toState;

    if (fromState === 'yard') {
      toStep = 0;
      toState = 'active';
    } else {
      toStep = fromStep + this.diceValue;
      toState = toStep === TOTAL_STEPS ? 'finished' : 'active';
    }

    // Step-by-step path calculation
    const pathCoords = [];
    if (fromState === 'yard') {
      pathCoords.push(getTokenCoordinate(activePIdx, tokenId, 'active', 0));
    } else {
      for (let s = fromStep + 1; s <= toStep; s++) {
        pathCoords.push(getTokenCoordinate(activePIdx, tokenId, s === TOTAL_STEPS ? 'finished' : 'active', s));
      }
    }

    // Animate token along path
    await this.animateTokenPath(activePIdx, tokenId, pathCoords);

    // Update state
    token.step = toStep;
    token.state = toState;
    sounds.playStep();

    let extraTurn = false;

    // Check Capture on perimeter track (step <= 50)
    if (toState === 'active' && toStep <= 50) {
      const targetTrackIndex = getTrackIndex(activePIdx, toStep);
      
      if (targetTrackIndex !== null && !SAFE_SQUARES.has(targetTrackIndex)) {
        // Find opponent token on this square
        for (const oppIdx of this.activePlayerIndices) {
          if (oppIdx === activePIdx) continue;

          for (const oppToken of this.tokens[oppIdx]) {
            if (oppToken.state === 'active' && oppToken.step <= 50) {
              const oppTrackIndex = getTrackIndex(oppIdx, oppToken.step);
              if (oppTrackIndex === targetTrackIndex) {
                // Capture!
                oppToken.state = 'yard';
                oppToken.step = -1;
                sounds.playCapture();
                this.showToast(`TOKEN CAPTURED! ${PLAYER_CONFIG[oppIdx].name} sent home! 💥`, '💥');
                extraTurn = true;
                break;
              }
            }
          }
          if (extraTurn) break;
        }
      } else if (targetTrackIndex !== null && SAFE_SQUARES.has(targetTrackIndex)) {
        sounds.playSafe();
      }
    }

    // Check Finish
    if (toState === 'finished') {
      sounds.playFinish();
      this.showToast('TOKEN FINISHED! 🏁 Extra turn granted!', '🏁');
      extraTurn = true;
    }

    // Check 6 Bonus
    if (this.diceValue === 6 && this.consecutiveSixes < 3) {
      extraTurn = true;
    }

    // Check Win Condition: all 4 tokens finished
    const finishedCount = playerTokens.filter(t => t.state === 'finished').length;
    if (finishedCount === 4) {
      this.winner = {
        playerIndex: activePIdx,
        name: this.playerNames[activePIdx],
        color: PLAYER_CONFIG[activePIdx].color
      };
      this.phase = 'finished';
      sounds.playVictory();
      this.clearSavedGame();
      this.showWinnerModal();
      this.isAnimating = false;
      return;
    }

    this.isAnimating = false;

    if (extraTurn) {
      this.phase = 'rolling';
      this.legalMoves = [];
      this.diceValue = null;
      this.renderGame();
    } else {
      this.consecutiveSixes = 0;
      this.advanceTurn();
    }

    this.saveState();
  }

  animateTokenPath(playerIndex, tokenId, pathCoords) {
    return new Promise(resolve => {
      let idx = 0;
      const timer = setInterval(() => {
        if (idx >= pathCoords.length) {
          clearInterval(timer);
          resolve();
          return;
        }

        const coord = pathCoords[idx];
        const tokenElem = document.getElementById(`token-${playerIndex}-${tokenId}`);
        const targetContainer = document.getElementById(`tc-${coord.r}-${coord.c}`);

        if (tokenElem && targetContainer) {
          targetContainer.appendChild(tokenElem);
          sounds.playStep();
        }
        idx++;
      }, 150);
    });
  }

  advanceTurn() {
    this.phase = 'rolling';
    this.diceValue = null;
    this.legalMoves = [];
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.activePlayerIndices.length;
    this.renderGame();
    this.saveState();
  }

  showWinnerModal() {
    const cfg = PLAYER_CONFIG[this.winner.playerIndex];
    this.dom.winnerName.textContent = `${cfg.badge} ${this.winner.name.toUpperCase()} WINS!`;
    this.openModal(this.dom.modalWinner);
  }

  // ==========================================================================
  // 8. LOCAL STORAGE PERSISTENCE (SAVE & CONTINUE)
  // ==========================================================================
  saveState() {
    if (this.phase === 'finished' || this.winner) {
      this.clearSavedGame();
      return;
    }

    const state = {
      selectedMode: this.selectedMode,
      activePlayerIndices: this.activePlayerIndices,
      playerNames: this.playerNames,
      currentTurnIndex: this.currentTurnIndex,
      phase: this.phase,
      diceValue: this.diceValue,
      consecutiveSixes: this.consecutiveSixes,
      legalMoves: this.legalMoves,
      tokens: this.tokens,
      timestamp: Date.now()
    };

    localStorage.setItem('ludo_offline_save', JSON.stringify(state));
  }

  checkSavedGame() {
    const saved = localStorage.getItem('ludo_offline_save');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state && state.tokens && state.activePlayerIndices) {
          this.dom.continueSection.classList.remove('hidden');
          return;
        }
      } catch (e) {}
    }
    this.dom.continueSection.classList.add('hidden');
  }

  continueSavedGame() {
    const saved = localStorage.getItem('ludo_offline_save');
    if (!saved) return;

    try {
      const state = JSON.parse(saved);
      this.selectedMode = state.selectedMode || 2;
      this.activePlayerIndices = state.activePlayerIndices || [0, 1];
      this.playerNames = state.playerNames || ['Player 1', 'Player 2'];
      this.currentTurnIndex = state.currentTurnIndex || 0;
      this.phase = state.phase || 'rolling';
      this.diceValue = state.diceValue || null;
      this.consecutiveSixes = state.consecutiveSixes || 0;
      this.legalMoves = state.legalMoves || [];
      this.tokens = state.tokens;
      this.winner = null;
      this.isAnimating = false;

      this.applyModeVisuals();
      this.switchView('game');
      this.renderGame();
      this.showToast('Game resumed from saved match!', '⚡');
    } catch (e) {
      this.clearSavedGame();
    }
  }

  clearSavedGame() {
    localStorage.removeItem('ludo_offline_save');
    this.dom.continueSection.classList.add('hidden');
  }

  // ==========================================================================
  // 9. EVENT LISTENERS & UI WIRING
  // ==========================================================================
  bindEvents() {
    // Mode selection (2p / 4p)
    this.dom.btnMode2p.addEventListener('click', () => {
      this.selectedMode = 2;
      this.dom.btnMode2p.classList.add('active');
      this.dom.btnMode4p.classList.remove('active');
      this.dom.cardP3.classList.add('hidden');
      this.dom.cardP4.classList.add('hidden');
    });

    this.dom.btnMode4p.addEventListener('click', () => {
      this.selectedMode = 4;
      this.dom.btnMode4p.classList.add('active');
      this.dom.btnMode2p.classList.remove('active');
      this.dom.cardP3.classList.remove('hidden');
      this.dom.cardP4.classList.remove('hidden');
    });

    // Start New Game
    this.dom.btnStartGame.addEventListener('click', () => {
      this.startNewGame(this.selectedMode);
    });

    // Continue Game
    this.dom.btnContinueGame.addEventListener('click', () => {
      this.continueSavedGame();
    });

    // Roll Dice
    this.dom.btnRollDice.addEventListener('click', () => this.handleRollDice());
    this.dom.diceCube.addEventListener('click', () => this.handleRollDice());

    // Controls
    const restartPrompt = () => {
      if (confirm('Restart current match from the beginning?')) {
        this.restartCurrentMatch();
      }
    };
    this.dom.btnRestartGame.addEventListener('click', restartPrompt);
    this.dom.btnSubRestart.addEventListener('click', restartPrompt);

    const exitToMenu = () => {
      if (confirm('Exit to start menu? (Your game will be saved)')) {
        this.saveState();
        this.switchView('start');
      }
    };
    this.dom.btnExitMenu.addEventListener('click', exitToMenu);
    this.dom.btnSubMenu.addEventListener('click', exitToMenu);

    this.dom.btnSubNewGame.addEventListener('click', () => {
      if (confirm('Start a new game with different players?')) {
        this.clearSavedGame();
        this.switchView('start');
      }
    });

    // Winner Actions
    this.dom.btnWinnerNewGame.addEventListener('click', () => {
      this.closeModal(this.dom.modalWinner);
      this.restartCurrentMatch();
    });

    this.dom.btnWinnerExit.addEventListener('click', () => {
      this.closeModal(this.dom.modalWinner);
      this.clearSavedGame();
      this.switchView('start');
    });

    // Rules Modal
    const openRules = () => this.openModal(this.dom.modalRules);
    this.dom.btnOpenRules.addEventListener('click', openRules);
    this.dom.btnRulesGame.addEventListener('click', openRules);
    this.dom.btnCloseRules.addEventListener('click', () => this.closeModal(this.dom.modalRules));
    this.dom.btnRulesOk.addEventListener('click', () => this.closeModal(this.dom.modalRules));

    // Sound Toggles
    const toggleSound = () => {
      const isEnabled = sounds.toggle();
      this.updateSoundButtons();
      this.showToast(isEnabled ? 'Sound ON' : 'Sound OFF', isEnabled ? '🔊' : '🔇');
    };
    this.dom.btnSoundGame.addEventListener('click', toggleSound);
    document.querySelectorAll('.sound-toggle-btn').forEach(btn => {
      btn.addEventListener('click', toggleSound);
    });
  }

  updateSoundButtons() {
    const isEnabled = sounds.enabled;
    const icon = isEnabled ? '🔊' : '🔇';
    const text = isEnabled ? 'SOUND ON' : 'SOUND OFF';

    document.querySelectorAll('.sound-icon').forEach(el => el.textContent = icon);
    document.querySelectorAll('.sound-toggle-btn').forEach(el => {
      if (el.tagName === 'BUTTON' && el.querySelector('.sound-icon')) {
        el.innerHTML = `<span class="sound-icon">${icon}</span> ${text}`;
      }
    });
  }

  // ==========================================================================
  // 10. NOTIFICATIONS & MODALS HELPER
  // ==========================================================================
  showToast(text, icon = '✨') {
    const toast = this.dom.eventToast;
    this.dom.toastText.textContent = text;
    this.dom.toastIcon.textContent = icon;
    toast.classList.remove('hidden');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2600);
  }

  openModal(modal) {
    if (modal) modal.classList.remove('hidden');
  }

  closeModal(modal) {
    if (modal) modal.classList.add('hidden');
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// Start offline game on load
window.addEventListener('DOMContentLoaded', () => {
  window.offlineLudo = new OfflineLudoGame();
});
