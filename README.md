# 🎲 Ludo - Complete Offline Multiplayer

> **A 100% offline, fully responsive local multiplayer Ludo game for 2 and 4 players. Built with pure HTML5, CSS3, and JavaScript with zero external dependencies, zero servers, and zero internet required.**

---

## 🌟 Overview

**Ludo Offline Multiplayer** is a complete, self-contained board game built specifically for pass-and-play local gaming on the **same device** (mobile, tablet, laptop, or desktop). 

It works seamlessly when:
- ✈️ **Airplane Mode is ON**
- 📶 **Wi-Fi & Ethernet are disconnected**
- 📵 **Mobile Hotspot is OFF**
- 🔒 **Zero internet access is available**

---

## ✨ Features

### 1. 👥 Game Modes (Human vs Human)
- **2-Player Mode**:
  - **Player 1**: 🔴 Red
  - **Player 2**: 🟢 Green
  - Yellow and Blue bases and paths are disabled.
  - Turn rotation: **Red ↔ Green**.
- **4-Player Mode**:
  - **Player 1**: 🔴 Red
  - **Player 2**: 🟢 Green
  - **Player 3**: 🟡 Yellow
  - **Player 4**: 🔵 Blue
  - Turn rotation: **Red → Green → Yellow → Blue → Red**.
- **100% Human**: No AI, no bots, no simulated computer players. Physical pass-and-play on the same device.

### 2. 🛡️ Complete International Ludo Rules
- **Base Release**: Rolling a **6** is required to bring a token out of the yard onto the starting square.
- **Extra Turns**:
  - Rolling a **6** grants an **extra roll**.
  - **Capturing** an opponent's token awards an **extra roll**.
  - **Finishing** a token in the center awards an **extra roll**.
- **Three-6s Rule**: Rolling three consecutive 6s forfeits the turn to ensure fair play.
- **8 Safe Squares**:
  - 4 Starting squares (`Red`, `Green`, `Yellow`, `Blue`)
  - 4 Star squares (marked with glowing ★ icons and protective styling)
  - Tokens resting on safe squares can **never** be captured. Multiple players' tokens can safely coexist there.
- **Home Runway & Exact Finish**:
  - After completing a full circuit of 51 perimeter squares, tokens turn into their player-colored home corridor.
  - Reaching the center finish triangle requires an **exact roll**.
- **Victory**: The first player to successfully navigate all 4 tokens home wins the match! 🏆

### 3. 💾 Save & Continue Match (`localStorage`)
- The game automatically saves after every single roll and token move.
- If you accidentally refresh, close the tab, or exit, click **[ ⚡ CONTINUE GAME ]** on the start screen to resume right where you left off.

### 4. 🔊 Procedural Web Audio Synthesizer
- Built-in zero-dependency sound engine generated via browser oscillators:
  - 🎲 Dice rattle and tumble
  - ♟️ Crisp wooden token hop
  - 💥 Resonant capture impact
  - ✨ Safe square chime
  - 🎺 Token finish fanfare
  - 👑 Triumphant victory chords
- **Sound Toggle**: Easy `🔊 SOUND ON / 🔇 SOUND OFF` toggle button.

### 5. 🎨 Modern & Responsive Design
- 15×15 pixel-perfect CSS Grid board.
- 3D perspective tumbling dice with pips.
- Glowing, pulsing animations on legal tokens.
- Fully responsive across desktop, tablets, and compact mobile phones down to 320px width without horizontal scrolling.

---

## 🎮 How to Play

### Option 1: Direct File Open (Zero Server Required)
Simply double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari:
```powershell
# In Windows PowerShell:
Start-Process index.html
```

### Option 2: Local HTTP Server (Optional)
If you prefer running a local server:
```bash
# Using Python:
python -m http.server 8080

# Or using Node:
npx serve .
```
Navigate to `http://localhost:8080` in your web browser.

---

## 🕹️ Controls

| Control | Action |
|---|---|
| **[ 2 PLAYERS ] / [ 4 PLAYERS ]** | Select match mode on the start screen |
| **Player Name Inputs** | Customize names for each player before starting |
| **[ 🎲 ROLL DICE ] / Tap Dice** | Roll the dice when it is your turn |
| **Tap Glowing Token** | Select and move any legally eligible token |
| **[ 🔄 RESTART ]** | Reset the current match with the same players |
| **[ ➕ NEW GAME ]** | Return to the setup screen to change players or mode |
| **[ 📖 RULES ]** | Open the interactive rules guide |
| **[ 🔊 SOUND ]** | Toggle sound effects on or off |
| **[ 🏠 MENU ]** | Exit to start screen (game is auto-saved) |

---

## 📁 Project Structure

```
anti/
├── index.html       # 100% self-contained offline HTML structure
├── style.css        # Responsive 15x15 board, 3D dice, and dark theme
├── script.js        # Offline game engine, Web Audio API, and local persistence
├── tests/
│   └── offlineEngineTest.js  # Automated rule validation test suite
└── README.md        # Documentation and gameplay instructions
```

---

## 📜 License

MIT License. Built for offline multiplayer entertainment.
