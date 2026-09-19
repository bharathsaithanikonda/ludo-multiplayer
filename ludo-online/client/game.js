/**
 * game.js - Client Controller for Real-Time Ludo Online
 * Full Socket.IO integration, 15x15 dynamic board renderer,
 * procedural Web Audio sound synthesizer, and 3D animated dice.
 */

// ============================================================================
// 1. PROCEDURAL WEB AUDIO SYNTHESIZER
// ============================================================================
class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('ludo_sound') !== 'false';
  }

  initContext() {
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
    localStorage.setItem('ludo_sound', this.enabled);
    return this.enabled;
  }

  // Dice rattling and rolling sound
  playDiceRoll() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const count = 5;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 220, this.ctx.currentTime);
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
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Resonant capture boom
  playCapture() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.35);
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
    this.initContext();
    if (!this.ctx) return;

    const freqs = [587.33, 880]; // D5, A5
    freqs.forEach((freq, idx) => {
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
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
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

  // Grand victory fanfare
  playVictory() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const chordNotes = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.00],
      [659.25, 830.61, 987.77],
      [783.99, 987.77, 1174.66, 1567.98]
    ];
    chordNotes.forEach((chord, i) => {
      setTimeout(() => {
        chord.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (i === 3 ? 0.9 : 0.4));
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + (i === 3 ? 0.9 : 0.4));
        });
      }, i * 220);
    });
  }
}

const sounds = new AudioSynthesizer();

// ============================================================================
// 2. COORDINATE & BOARD CONFIGURATION
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

// ============================================================================
// 3. APPLICATION STATE & SOCKET SETUP
// ============================================================================
class LudoClient {
  constructor() {
    this.socket = null;
    this.roomCode = null;
    this.sessionToken = null;
    this.player = null; // Local player info
    this.gameState = null; // Authoritative room state
    this.unreadChatCount = 0;
    this.isChatOpen = false;
    this.isAnimating = false;

    // DOM Elements
    this.dom = {
      app: document.getElementById('app'),
      viewHome: document.getElementById('view-home'),
      viewLobby: document.getElementById('view-lobby'),
      viewGame: document.getElementById('view-game'),
      
      // Home elements
      inputName: document.getElementById('input-player-name'),
      btnHomeCreate: document.getElementById('btn-home-create'),
      btnHomeJoinModal: document.getElementById('btn-home-join-modal'),
      btnHomeRules: document.getElementById('btn-home-rules'),

      // Lobby elements
      displayRoomCode: document.getElementById('display-room-code'),
      btnCopyRoomCode: document.getElementById('btn-copy-room-code'),
      copyBtnText: document.getElementById('copy-btn-text'),
      lobbyStatusText: document.getElementById('lobby-status-text'),
      lobbyPlayerSlots: document.getElementById('lobby-player-slots'),
      btnStartGame: document.getElementById('btn-start-game'),
      btnLeaveLobby: document.getElementById('btn-leave-lobby'),
      btnSoundLobby: document.getElementById('btn-sound-toggle-lobby'),

      // Game view elements
      gameRoomCodeVal: document.getElementById('game-room-code-val'),
      gamePlayerCountVal: document.getElementById('game-player-count-val'),
      bannerTurnDot: document.getElementById('banner-turn-dot'),
      bannerTurnText: document.getElementById('banner-turn-text'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      btnChatToggle: document.getElementById('btn-chat-toggle'),
      chatUnreadBadge: document.getElementById('chat-unread-badge'),
      btnLeaveGame: document.getElementById('btn-leave-game'),

      // Board & Dashboard
      ludoBoard: document.getElementById('ludo-board'),
      gamePlayersList: document.getElementById('game-players-list'),
      dice3D: document.getElementById('dice-3d'),
      btnRollDice: document.getElementById('btn-roll-dice'),
      diceStatusMsg: document.getElementById('dice-status-msg'),

      // Chat Drawer
      chatDrawer: document.getElementById('chat-drawer'),
      btnCloseChat: document.getElementById('btn-close-chat'),
      chatMessages: document.getElementById('chat-messages'),
      chatForm: document.getElementById('chat-form'),
      chatInput: document.getElementById('chat-input'),

      // Modals
      modalJoin: document.getElementById('modal-join'),
      inputJoinCode: document.getElementById('input-join-room-code'),
      btnModalJoinSubmit: document.getElementById('btn-modal-join-submit'),
      btnModalJoinCancel: document.getElementById('btn-modal-join-cancel'),
      btnCloseJoinModal: document.getElementById('btn-close-join-modal'),
      joinErrorMsg: document.getElementById('join-error-msg'),

      modalRules: document.getElementById('modal-rules'),
      btnModalRulesClose: document.getElementById('btn-modal-rules-close'),
      btnCloseRulesModal: document.getElementById('btn-close-rules-modal'),

      modalWinner: document.getElementById('modal-winner'),
      winnerNameDisplay: document.getElementById('winner-name-display'),
      btnNewGame: document.getElementById('btn-new-game'),
      btnWinnerLeave: document.getElementById('btn-winner-leave'),

      // Notifications
      globalAlert: document.getElementById('global-alert'),
      globalAlertText: document.getElementById('global-alert-text'),
      btnCloseAlert: document.getElementById('btn-close-alert'),
      eventToast: document.getElementById('event-toast'),
      toastText: document.getElementById('toast-text'),
      toastIcon: document.getElementById('toast-icon')
    };

    this.init();
  }

  init() {
    this.setupSocket();
    this.buildBoardGrid();
    this.bindEvents();
    this.loadSavedName();

    // Check URL parameters for direct room joining e.g. ?room=LUDO-7K9P2
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      this.dom.inputJoinCode.value = roomParam.trim().toUpperCase();
      this.openModal(this.dom.modalJoin);
    }
  }

  setupSocket() {
    // Connect to same origin host
    this.socket = io({
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to Ludo server, socket id:', this.socket.id);
      this.checkAutoReconnect();
    });

    this.socket.on('disconnect', () => {
      this.showGlobalAlert('Disconnected from server. Attempting reconnection...', false);
    });

    this.socket.on('errorNotice', (data) => {
      this.showToast(data.message || 'An error occurred', '⚠️');
      if (this.dom.joinErrorMsg) {
        this.dom.joinErrorMsg.textContent = data.message;
        this.dom.joinErrorMsg.classList.remove('hidden');
      }
    });

    // Room created
    this.socket.on('roomCreated', (data) => {
      this.roomCode = data.roomCode;
      this.player = data.player;
      this.sessionToken = data.sessionToken;
      this.gameState = data.roomState;
      this.saveSession();
      this.switchView('lobby');
      this.renderLobby();
    });

    // Room joined
    this.socket.on('roomJoined', (data) => {
      this.roomCode = data.roomCode;
      this.player = data.player;
      this.sessionToken = data.sessionToken;
      this.gameState = data.roomState;
      this.saveSession();
      this.closeModal(this.dom.modalJoin);

      if (this.gameState.status === 'playing') {
        this.switchView('game');
        this.renderGame();
      } else {
        this.switchView('lobby');
        this.renderLobby();
      }
    });

    // Player joined broadcast
    this.socket.on('playerJoined', (data) => {
      this.gameState = data.roomState;
      if (this.currentView === 'lobby') {
        this.renderLobby();
      } else if (this.currentView === 'game') {
        this.renderGame();
      }
      this.showToast(`${data.player.name} joined the room!`, '👋');
    });

    // Player reconnected broadcast
    this.socket.on('playerReconnected', (data) => {
      this.gameState = data.roomState;
      this.hideGlobalAlert();
      this.showToast(`${data.player.name} reconnected!`, '⚡');
      this.renderGame();
    });

    // Player disconnected broadcast
    this.socket.on('playerDisconnected', (data) => {
      this.gameState = data.roomState;
      this.showToast(`${data.player.name} disconnected. Waiting for reconnection...`, '⚠️');
      this.renderGame();
    });

    // Player left
    this.socket.on('playerLeft', (data) => {
      this.gameState = data.roomState;
      this.showToast(`${data.player.name} left the room.`, '🚪');
      if (this.currentView === 'lobby') {
        this.renderLobby();
      } else {
        this.renderGame();
      }
    });

    // Game started
    this.socket.on('gameStarted', (data) => {
      this.gameState = data.roomState;
      this.switchView('game');
      this.renderGame();
      this.showToast('Game Started! Red player rolls first.', '🎲');
    });

    // Dice rolled broadcast
    this.socket.on('diceRolled', (data) => {
      this.handleDiceRolled(data);
    });

    // Token moved broadcast
    this.socket.on('tokenMoved', (data) => {
      this.handleTokenMoved(data);
    });

    // Game won broadcast
    this.socket.on('gameWon', (data) => {
      this.gameState = data.roomState;
      sounds.playVictory();
      this.showWinnerModal(data.winner);
    });

    // Game restarted broadcast
    this.socket.on('gameRestarted', (data) => {
      this.gameState = data.roomState;
      this.closeModal(this.dom.modalWinner);
      this.renderGame();
      this.showToast('New game started!', '🔄');
    });

    // Real-time chat received
    this.socket.on('chatReceived', (msg) => {
      this.appendChatMessage(msg);
    });
  }

  saveSession() {
    sessionStorage.setItem('ludo_room_code', this.roomCode);
    sessionStorage.setItem('ludo_session_token', this.sessionToken);
  }

  clearSession() {
    sessionStorage.removeItem('ludo_room_code');
    sessionStorage.removeItem('ludo_session_token');
    this.roomCode = null;
    this.sessionToken = null;
    this.player = null;
    this.gameState = null;
  }

  checkAutoReconnect() {
    const savedCode = sessionStorage.getItem('ludo_room_code');
    const savedToken = sessionStorage.getItem('ludo_session_token');
    if (savedCode && savedToken) {
      this.socket.emit('joinRoom', {
        roomCode: savedCode,
        sessionToken: savedToken
      });
    }
  }

  loadSavedName() {
    const name = localStorage.getItem('ludo_player_name') || '';
    this.dom.inputName.value = name;
  }

  saveName() {
    const name = this.dom.inputName.value.trim();
    if (name) {
      localStorage.setItem('ludo_player_name', name);
    }
  }

  // ==========================================================================
  // 4. BOARD GRID BUILDER (15x15)
  // ==========================================================================
  buildBoardGrid() {
    const board = this.dom.ludoBoard;
    board.innerHTML = '';

    // Create 15x15 = 225 grid cells
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.id = `cell-${r}-${c}`;
        cell.dataset.r = r;
        cell.dataset.c = c;

        // Determine cell role
        // 1. Home Bases (6x6 Quadrants)
        if (r < 6 && c < 6) {
          // Top-Left: Red Base
          if (r === 0 && c === 0) {
            cell.className += ' home-base base-red';
            cell.style.gridArea = '1 / 1 / 7 / 7';
            cell.innerHTML = `
              <div class="home-base-inner">
                <div class="yard-pocket" id="pocket-0-0"><div class="tokens-container" id="tc-2-2"></div></div>
                <div class="yard-pocket" id="pocket-0-1"><div class="tokens-container" id="tc-2-3"></div></div>
                <div class="yard-pocket" id="pocket-0-2"><div class="tokens-container" id="tc-3-2"></div></div>
                <div class="yard-pocket" id="pocket-0-3"><div class="tokens-container" id="tc-3-3"></div></div>
              </div>
            `;
          } else {
            // Covered by gridArea 1/1/7/7, skip adding extra
            continue;
          }
        } else if (r < 6 && c >= 9) {
          // Top-Right: Green Base
          if (r === 0 && c === 9) {
            cell.className += ' home-base base-green';
            cell.style.gridArea = '1 / 10 / 7 / 16';
            cell.innerHTML = `
              <div class="home-base-inner">
                <div class="yard-pocket" id="pocket-1-0"><div class="tokens-container" id="tc-2-11"></div></div>
                <div class="yard-pocket" id="pocket-1-1"><div class="tokens-container" id="tc-2-12"></div></div>
                <div class="yard-pocket" id="pocket-1-2"><div class="tokens-container" id="tc-3-11"></div></div>
                <div class="yard-pocket" id="pocket-1-3"><div class="tokens-container" id="tc-3-12"></div></div>
              </div>
            `;
          } else {
            continue;
          }
        } else if (r >= 9 && c >= 9) {
          // Bottom-Right: Yellow Base
          if (r === 9 && c === 9) {
            cell.className += ' home-base base-yellow';
            cell.style.gridArea = '10 / 10 / 16 / 16';
            cell.innerHTML = `
              <div class="home-base-inner">
                <div class="yard-pocket" id="pocket-2-0"><div class="tokens-container" id="tc-11-11"></div></div>
                <div class="yard-pocket" id="pocket-2-1"><div class="tokens-container" id="tc-11-12"></div></div>
                <div class="yard-pocket" id="pocket-2-2"><div class="tokens-container" id="tc-12-11"></div></div>
                <div class="yard-pocket" id="pocket-2-3"><div class="tokens-container" id="tc-12-12"></div></div>
              </div>
            `;
          } else {
            continue;
          }
        } else if (r >= 9 && c < 6) {
          // Bottom-Left: Blue Base
          if (r === 9 && c === 0) {
            cell.className += ' home-base base-blue';
            cell.style.gridArea = '10 / 1 / 16 / 7';
            cell.innerHTML = `
              <div class="home-base-inner">
                <div class="yard-pocket" id="pocket-3-0"><div class="tokens-container" id="tc-11-2"></div></div>
                <div class="yard-pocket" id="pocket-3-1"><div class="tokens-container" id="tc-11-3"></div></div>
                <div class="yard-pocket" id="pocket-3-2"><div class="tokens-container" id="tc-12-2"></div></div>
                <div class="yard-pocket" id="pocket-3-3"><div class="tokens-container" id="tc-12-3"></div></div>
              </div>
            `;
          } else {
            continue;
          }
        } else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
          // Center Finishing Triangle Zone (3x3)
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
          } else {
            continue;
          }
        } else {
          // Track cell or colored home runway
          // Add tokens container
          const tc = document.createElement('div');
          tc.className = 'tokens-container';
          tc.id = `tc-${r}-${c}`;
          cell.appendChild(tc);

          // Check Home Corridors
          if (r === 7 && c >= 1 && c <= 5) {
            cell.classList.add('cell-red-path');
          } else if (c === 7 && r >= 1 && r <= 5) {
            cell.classList.add('cell-green-path');
          } else if (r === 7 && c >= 9 && c <= 13) {
            cell.classList.add('cell-yellow-path');
          } else if (c === 7 && r >= 9 && r <= 13) {
            cell.classList.add('cell-blue-path');
          }

          // Check Start Cells
          if (r === 6 && c === 1) cell.classList.add('cell-red-start');
          if (r === 1 && c === 8) cell.classList.add('cell-green-start');
          if (r === 8 && c === 13) cell.classList.add('cell-yellow-start');
          if (r === 13 && c === 6) cell.classList.add('cell-blue-start');

          // Check Safe Stars
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
  // 5. VIEW MANAGEMENT & RENDERING
  // ==========================================================================
  switchView(viewName) {
    this.currentView = viewName;
    this.dom.viewHome.classList.remove('active');
    this.dom.viewLobby.classList.remove('active');
    this.dom.viewGame.classList.remove('active');

    this.dom.viewHome.classList.add('hidden');
    this.dom.viewLobby.classList.add('hidden');
    this.dom.viewGame.classList.add('hidden');

    if (viewName === 'home') {
      this.dom.viewHome.classList.add('active');
      this.dom.viewHome.classList.remove('hidden');
    } else if (viewName === 'lobby') {
      this.dom.viewLobby.classList.add('active');
      this.dom.viewLobby.classList.remove('hidden');
    } else if (viewName === 'game') {
      this.dom.viewGame.classList.add('active');
      this.dom.viewGame.classList.remove('hidden');
    }
  }

  renderLobby() {
    if (!this.gameState) return;

    this.dom.displayRoomCode.textContent = this.gameState.code;
    const count = this.gameState.players.length;
    this.dom.lobbyStatusText.textContent = `WAITING FOR PLAYERS... (${count}/4)`;

    // Render 4 Player Slots
    this.dom.lobbyPlayerSlots.innerHTML = '';
    const colorNames = ['Red', 'Green', 'Yellow', 'Blue'];
    const colorClasses = ['slot-red', 'slot-green', 'slot-yellow', 'slot-blue'];
    const avatars = ['🔴', '🟢', '🟡', '🔵'];

    for (let i = 0; i < 4; i++) {
      const p = this.gameState.players[i];
      const slot = document.createElement('div');
      slot.className = `player-slot-card ${colorClasses[i]} ${p ? 'occupied' : 'empty'}`;

      if (p) {
        slot.innerHTML = `
          <div class="slot-avatar">${avatars[i]}</div>
          <div class="slot-info">
            <span class="slot-name">${this.escapeHtml(p.name)}</span>
            <span class="slot-role">${p.isHost ? '👑 Host' : colorNames[i] + ' Player'} ${p.playerIndex === this.player.playerIndex ? '(You)' : ''}</span>
          </div>
        `;
      } else {
        slot.innerHTML = `
          <div class="slot-avatar" style="opacity: 0.3;">${avatars[i]}</div>
          <div class="slot-info">
            <span class="slot-name" style="color: var(--text-muted);">Empty Slot</span>
            <span class="slot-role">Waiting to join...</span>
          </div>
        `;
      }
      this.dom.lobbyPlayerSlots.appendChild(slot);
    }

    // Host Start Game Button
    if (this.player && this.player.isHost) {
      this.dom.btnStartGame.style.display = 'inline-flex';
      this.dom.btnStartGame.disabled = count < 2;
    } else {
      this.dom.btnStartGame.style.display = 'none';
    }
  }

  renderGame() {
    if (!this.gameState) return;

    // Room info
    this.dom.gameRoomCodeVal.textContent = this.gameState.code;
    this.dom.gamePlayerCountVal.textContent = `${this.gameState.players.length}/4 Players`;

    // Turn Banner
    const activePlayer = this.gameState.players[this.gameState.currentTurn];
    if (activePlayer) {
      const colorMap = { red: '🔴', green: '🟢', yellow: '🟡', blue: '🔵' };
      const badge = colorMap[activePlayer.color] || '🎲';
      const isMe = this.player && activePlayer.playerIndex === this.player.playerIndex;

      this.dom.bannerTurnDot.style.background = `var(--color-${activePlayer.color})`;
      if (isMe) {
        if (this.gameState.phase === 'rolling') {
          this.dom.bannerTurnText.textContent = `YOUR TURN! 🎲 Roll the dice`;
        } else if (this.gameState.phase === 'moving') {
          this.dom.bannerTurnText.textContent = `YOUR TURN! ♟️ Tap a glowing token to move`;
        }
      } else {
        this.dom.bannerTurnText.textContent = `${badge} ${this.escapeHtml(activePlayer.name)}'s Turn`;
      }
    }

    // Render Player Cards in sidebar
    this.renderPlayerCards();

    // Render Dice Station
    this.renderDiceStation();

    // Render Tokens on Board
    this.renderTokens();
  }

  renderPlayerCards() {
    this.dom.gamePlayersList.innerHTML = '';
    const avatars = ['🔴', '🟢', '🟡', '🔵'];

    this.gameState.players.forEach((p) => {
      const isTurn = p.playerIndex === this.gameState.currentTurn;
      const isMe = this.player && p.playerIndex === this.player.playerIndex;
      const card = document.createElement('div');
      card.className = `player-card card-${p.color} ${isTurn ? 'active-turn' : ''}`;

      // Count finished tokens
      const playerTokens = this.gameState.tokens[p.playerIndex] || [];
      const finishedCount = playerTokens.filter(t => t.state === 'finished').length;

      card.innerHTML = `
        <div class="card-left">
          <div class="player-avatar-circle">${avatars[p.playerIndex]}</div>
          <div class="player-details">
            <span class="player-card-name">${this.escapeHtml(p.name)} ${isMe ? '(You)' : ''}</span>
            <span class="player-card-meta">${p.connected ? '🟢 Online' : '🟠 Reconnecting...'}</span>
          </div>
        </div>
        <div class="card-right">
          <div class="finished-score" title="Finished Tokens">
            <span>🏁</span> ${finishedCount}/4
          </div>
        </div>
      `;
      this.dom.gamePlayersList.appendChild(card);
    });
  }

  renderDiceStation() {
    const isMyTurn = this.player && this.gameState.currentTurn === this.player.playerIndex;
    const canRoll = isMyTurn && this.gameState.phase === 'rolling';

    this.dom.btnRollDice.disabled = !canRoll;

    if (canRoll) {
      this.dom.btnRollDice.classList.add('btn-glow');
      this.dom.diceStatusMsg.textContent = 'Click ROLL DICE or tap the dice!';
    } else if (isMyTurn && this.gameState.phase === 'moving') {
      this.dom.btnRollDice.classList.remove('btn-glow');
      this.dom.diceStatusMsg.textContent = 'Select a glowing token to move';
    } else {
      this.dom.btnRollDice.classList.remove('btn-glow');
      const activeP = this.gameState.players[this.gameState.currentTurn];
      this.dom.diceStatusMsg.textContent = activeP ? `Waiting for ${activeP.name}...` : 'Waiting...';
    }

    if (this.gameState.diceValue) {
      this.dom.dice3D.dataset.value = this.gameState.diceValue;
    }
  }

  renderTokens() {
    // Clear existing tokens from all cells
    document.querySelectorAll('.tokens-container').forEach(tc => {
      tc.innerHTML = '';
      tc.classList.remove('multi-tokens');
    });

    if (!this.gameState || !this.gameState.tokens) return;

    const isMyTurn = this.player && this.gameState.currentTurn === this.player.playerIndex;
    const canMove = isMyTurn && this.gameState.phase === 'moving';
    const legalMoves = this.gameState.legalMoves || [];

    // Map to group tokens on identical coordinates
    const cellTokenMap = new Map();

    // Iterate all players and tokens
    for (const [pIdxStr, tokens] of Object.entries(this.gameState.tokens)) {
      const pIdx = parseInt(pIdxStr, 10);
      const cfg = PLAYER_CONFIG[pIdx];
      if (!cfg) continue;

      tokens.forEach(token => {
        const coord = getTokenCoordinate(pIdx, token.id, token.state, token.step);
        if (!coord) return;

        const key = `${coord.r}-${coord.c}`;
        if (!cellTokenMap.has(key)) cellTokenMap.set(key, []);
        cellTokenMap.get(key).push({ playerIndex: pIdx, token, cfg });
      });
    }

    // Place tokens into respective containers
    for (const [key, tokenGroup] of cellTokenMap.entries()) {
      const tc = document.getElementById(`tc-${key}`);
      if (!tc) continue;

      if (tokenGroup.length > 1) {
        tc.classList.add('multi-tokens');
      }

      tokenGroup.forEach(({ playerIndex, token, cfg }) => {
        const tokenElem = document.createElement('div');
        tokenElem.className = `ludo-token token-${cfg.color}`;
        tokenElem.textContent = `${cfg.label}${token.id + 1}`;
        tokenElem.id = `token-${playerIndex}-${token.id}`;

        // Check if this token is legal to move
        const isLegal = canMove && playerIndex === this.player.playerIndex && legalMoves.includes(token.id);
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
  // 6. EVENT HANDLERS & ANIMATIONS
  // ==========================================================================
  handleRollClick() {
    if (!this.player || this.gameState.currentTurn !== this.player.playerIndex) return;
    if (this.gameState.phase !== 'rolling') return;

    this.dom.btnRollDice.disabled = true;
    this.socket.emit('rollDice', { roomCode: this.roomCode });
  }

  handleDiceRolled(data) {
    sounds.playDiceRoll();

    // Animate 3D dice roll
    const dice = this.dom.dice3D;
    dice.classList.add('rolling');

    setTimeout(() => {
      dice.classList.remove('rolling');
      dice.dataset.value = data.diceValue;
      this.gameState = data.roomState;

      // Check special announcements
      if (data.threeSixesPenalty) {
        this.showToast('Three 6s rolled! Turn forfeited.', '❌');
      } else if (data.autoPass) {
        this.showToast('No legal moves! Passing turn.', '⏩');
      } else if (data.diceValue === 6) {
        this.showToast('YOU ROLLED A 6! Extra roll granted 🎲', '🔥');
      }

      this.renderGame();
    }, 750);
  }

  handleTokenClick(tokenId) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.socket.emit('moveToken', { roomCode: this.roomCode, tokenId });
  }

  async handleTokenMoved(data) {
    const { moveResult } = data;
    this.gameState = data.roomState;

    if (moveResult && moveResult.pathCoordinates && moveResult.pathCoordinates.length > 0) {
      // Step-by-step token hopping animation
      await this.animateTokenPath(moveResult.playerIndex, moveResult.tokenId, moveResult.pathCoordinates);
    }

    sounds.playStep();

    // Check capture
    if (moveResult.capturedToken) {
      sounds.playCapture();
      const oppCfg = PLAYER_CONFIG[moveResult.capturedToken.playerIndex];
      this.showToast(`TOKEN CAPTURED! ${oppCfg.name} sent back to yard! 💥`, '💥');
    }

    // Check finish
    if (moveResult.isFinish) {
      sounds.playFinish();
      this.showToast('TOKEN FINISHED! 🏁 Extra turn!', '🏁');
    }

    this.isAnimating = false;
    this.renderGame();
  }

  animateTokenPath(playerIndex, tokenId, pathCoords) {
    return new Promise(resolve => {
      let stepIndex = 0;
      const interval = setInterval(() => {
        if (stepIndex >= pathCoords.length) {
          clearInterval(interval);
          resolve();
          return;
        }

        const coord = pathCoords[stepIndex];
        const tokenElem = document.getElementById(`token-${playerIndex}-${tokenId}`);
        const targetContainer = document.getElementById(`tc-${coord.r}-${coord.c}`);

        if (tokenElem && targetContainer) {
          targetContainer.appendChild(tokenElem);
          sounds.playStep();
        }
        stepIndex++;
      }, 160);
    });
  }

  showWinnerModal(winner) {
    const colorMap = { red: 'RED', green: 'GREEN', yellow: 'YELLOW', blue: 'BLUE' };
    const colName = colorMap[winner.color] || 'WINNER';
    this.dom.winnerNameDisplay.textContent = `${colName} PLAYER WINS! (${winner.name})`;
    this.openModal(this.dom.modalWinner);

    // Only host can click New Game
    if (this.player && this.player.isHost) {
      this.dom.btnNewGame.style.display = 'inline-flex';
    } else {
      this.dom.btnNewGame.style.display = 'none';
    }
  }

  // ==========================================================================
  // 7. IN-GAME CHAT
  // ==========================================================================
  appendChatMessage(msg) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble bubble-${msg.color}`;
    bubble.innerHTML = `
      <div class="chat-bubble-sender" style="color: var(--color-${msg.color});">${this.escapeHtml(msg.senderName)}</div>
      <div class="chat-bubble-text">${this.escapeHtml(msg.text)}</div>
    `;
    this.dom.chatMessages.appendChild(bubble);
    this.dom.chatMessages.scrollTop = this.dom.chatMessages.scrollHeight;

    if (!this.isChatOpen) {
      this.unreadChatCount++;
      this.dom.chatUnreadBadge.textContent = this.unreadChatCount;
      this.dom.chatUnreadBadge.classList.remove('hidden');
    }
  }

  sendChatMessage(text) {
    if (!text || !this.roomCode) return;
    this.socket.emit('chatMessage', { roomCode: this.roomCode, text });
  }

  // ==========================================================================
  // 8. NOTIFICATIONS & MODALS
  // ==========================================================================
  showToast(text, icon = '✨') {
    const toast = this.dom.eventToast;
    this.dom.toastText.textContent = text;
    this.dom.toastIcon.textContent = icon;
    toast.classList.remove('hidden');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  showGlobalAlert(text, canClose = true) {
    this.dom.globalAlertText.textContent = text;
    this.dom.btnCloseAlert.style.display = canClose ? 'block' : 'none';
    this.dom.globalAlert.classList.remove('hidden');
  }

  hideGlobalAlert() {
    this.dom.globalAlert.classList.add('hidden');
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

  // ==========================================================================
  // 9. EVENT LISTENERS
  // ==========================================================================
  bindEvents() {
    // 1. Create Room
    this.dom.btnHomeCreate.addEventListener('click', () => {
      this.saveName();
      const playerName = this.dom.inputName.value.trim() || 'Player 1';
      this.socket.emit('createRoom', { playerName });
    });

    // 2. Open Join Modal
    this.dom.btnHomeJoinModal.addEventListener('click', () => {
      this.saveName();
      this.openModal(this.dom.modalJoin);
      this.dom.inputJoinCode.focus();
    });

    // 3. Submit Join
    this.dom.btnModalJoinSubmit.addEventListener('click', () => {
      const code = this.dom.inputJoinCode.value.trim().toUpperCase();
      if (!code) return;
      const playerName = this.dom.inputName.value.trim() || 'Player 2';
      this.socket.emit('joinRoom', { roomCode: code, playerName });
    });

    this.dom.inputJoinCode.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.dom.btnModalJoinSubmit.click();
    });

    this.dom.btnModalJoinCancel.addEventListener('click', () => this.closeModal(this.dom.modalJoin));
    this.dom.btnCloseJoinModal.addEventListener('click', () => this.closeModal(this.dom.modalJoin));

    // 4. How to play rules
    this.dom.btnHomeRules.addEventListener('click', () => this.openModal(this.dom.modalRules));
    this.dom.btnModalRulesClose.addEventListener('click', () => this.closeModal(this.dom.modalRules));
    this.dom.btnCloseRulesModal.addEventListener('click', () => this.closeModal(this.dom.modalRules));

    // 5. Copy Room Code
    this.dom.btnCopyRoomCode.addEventListener('click', () => {
      if (!this.roomCode) return;
      navigator.clipboard.writeText(this.roomCode).then(() => {
        this.dom.copyBtnText.textContent = 'COPIED! ✅';
        setTimeout(() => {
          this.dom.copyBtnText.textContent = '📋 COPY CODE';
        }, 2000);
      }).catch(() => {
        // Fallback
        const el = document.createElement('textarea');
        el.value = this.roomCode;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        this.dom.copyBtnText.textContent = 'COPIED! ✅';
        setTimeout(() => {
          this.dom.copyBtnText.textContent = '📋 COPY CODE';
        }, 2000);
      });
    });

    // 6. Start Game
    this.dom.btnStartGame.addEventListener('click', () => {
      if (!this.roomCode) return;
      this.socket.emit('startGame', { roomCode: this.roomCode });
    });

    // 7. Leave Lobby / Game
    const leaveAction = () => {
      if (confirm('Are you sure you want to leave the game?')) {
        this.socket.emit('leaveRoom', { roomCode: this.roomCode });
        this.clearSession();
        this.switchView('home');
      }
    };
    this.dom.btnLeaveLobby.addEventListener('click', leaveAction);
    this.dom.btnLeaveGame.addEventListener('click', leaveAction);
    this.dom.btnWinnerLeave.addEventListener('click', () => {
      this.closeModal(this.dom.modalWinner);
      leaveAction();
    });

    // 8. Dice Roll
    this.dom.btnRollDice.addEventListener('click', () => this.handleRollClick());
    this.dom.dice3D.addEventListener('click', () => this.handleRollClick());

    // 9. Sound Toggles
    const toggleAudio = () => {
      const isEnabled = sounds.toggle();
      const icon = isEnabled ? '🔊' : '🔇';
      document.querySelectorAll('.sound-icon').forEach(el => el.textContent = icon);
      this.showToast(isEnabled ? 'Sound ON' : 'Sound OFF', isEnabled ? '🔊' : '🔇');
    };
    this.dom.btnSoundToggle.addEventListener('click', toggleAudio);
    if (this.dom.btnSoundLobby) {
      this.dom.btnSoundLobby.addEventListener('click', toggleAudio);
    }

    // 10. Chat Drawer
    this.dom.btnChatToggle.addEventListener('click', () => {
      this.isChatOpen = !this.isChatOpen;
      this.dom.chatDrawer.classList.toggle('hidden', !this.isChatOpen);
      if (this.isChatOpen) {
        this.unreadChatCount = 0;
        this.dom.chatUnreadBadge.classList.add('hidden');
        this.dom.chatInput.focus();
      }
    });

    this.dom.btnCloseChat.addEventListener('click', () => {
      this.isChatOpen = false;
      this.dom.chatDrawer.classList.add('hidden');
    });

    this.dom.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.dom.chatInput.value.trim();
      if (text) {
        this.sendChatMessage(text);
        this.dom.chatInput.value = '';
      }
    });

    // Quick message buttons
    document.querySelectorAll('.quick-msg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sendChatMessage(btn.textContent);
      });
    });

    // 11. New Game
    this.dom.btnNewGame.addEventListener('click', () => {
      this.socket.emit('restartGame', { roomCode: this.roomCode });
    });

    // 12. Close alert
    this.dom.btnCloseAlert.addEventListener('click', () => this.hideGlobalAlert());
  }
}

// Start client once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.ludoGame = new LudoClient();
});
