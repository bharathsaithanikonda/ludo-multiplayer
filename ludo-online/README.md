# 🎲 Ludo Online - Real-Time Multiplayer Board Game

> **A complete, authoritative, real-time online multiplayer Ludo game for 2 to 4 players built with Node.js, Express, Socket.IO, HTML5, CSS3, and modern JavaScript.**

---

## 🌟 Overview

**Ludo Online** brings the timeless, beloved board game to modern web browsers with zero installations or plugins required. It supports real human players across different devices—desktops, laptops, tablets, and mobile phones—interacting over the internet in real time.

Built with a **100% server-authoritative architecture**, the game guarantees fair play by validating all dice rolls, turn sequences, legal moves, safe square protections, piece captures, and finish conditions directly on the Node.js server.

---

## ✨ Features

### 1. 👥 Real-Time Multiplayer (2 to 4 Players)
- **Room Code System**: Instant 1-click room creation with unique room codes (e.g. `LUDO-7K9P2`).
- **Seamless Lobby**: Share your room code or copy with the 📋 **COPY CODE** button.
- **Seat Capacity**: Supports 2, 3, or 4 players with automatic color assignment:
  - 🔴 **Player 1**: Red (Host)
  - 🟢 **Player 2**: Green
  - 🟡 **Player 3**: Yellow
  - 🔵 **Player 4**: Blue
- **Room Protection**: Automatically caps at 4 players, rejecting any 5th player with `ROOM FULL`.

### 2. 🛡️ Authoritative Server & Anti-Cheat Engine
- **Server-Generated Dice**: Dice results (1–6) are generated and validated on the server to eliminate client manipulation.
- **Turn Enforcement**: Strict validation ensures only the active player can roll or move.
- **Move Calculation**: Server calculates all legal moves; clients cannot send arbitrary coordinates.
- **Full Reconnection Handling**: Player session tokens (`sessionStorage`) allow seamless reconnection if a player accidentally refreshes or temporarily drops connection.

### 3. 🎯 Complete International Ludo Rules
- **Yard Release**: Rolling a **6** is required to bring a token onto the starting square.
- **Extra Turns**:
  - Rolling a **6** grants an immediate extra roll.
  - **Capturing** an opponent's token awards an extra roll.
  - **Finishing** a token in the center awards an extra roll.
- **Three-6s Rule**: Rolling 3 consecutive sixes automatically forfeits the turn to prevent infinite loops.
- **8 Safe Squares**:
  - 4 Starting squares (Red `(6,1)`, Green `(1,8)`, Yellow `(8,13)`, Blue `(13,6)`)
  - 4 Star squares (marked with glowing ★ icons and protective shields)
  - Tokens on safe squares can **never** be captured. Multiple players' tokens can safely coexist there.
- **Exact Roll to Finish**: Tokens enter their colored home corridor and require the exact dice value to reach the final center finish.
- **Victory Condition**: The first player to bring all 4 tokens home wins the match! 🏆

### 4. 🎨 Modern & Responsive Design
- **15×15 Dynamic Board**: Pixel-perfect grid layout matching standard international Ludo boards.
- **3D Animated Dice**: Interactive rolling cube with realistic tumbling physics and pips.
- **Glowing Legal Tokens**: Tokens eligible to move pulse with a glowing neon aura and smooth step-by-step path animations.
- **Responsive Down to 320px**: Scales seamlessly across ultra-wide monitors, laptops, tablets, and compact mobile screens with zero horizontal scrolling.

### 5. 🔊 Procedural Web Audio API Synthesizer
- Built-in zero-dependency sound effects generated via Web Audio oscillators:
  - 🎲 Dice rattle and tumble
  - ♟️ Crisp wooden token hop
  - 💥 Resonant capture impact
  - ✨ Safe square arrival chime
  - 🎺 Token finish fanfare
  - 👑 Triumphant victory chord progression
- **Sound Toggle**: Easy 🔊 Sound ON / 🔇 Sound OFF switch.

### 6. 💬 Synchronized Live Chat
- Real-time in-game chat drawer powered by WebSockets.
- Quick reaction buttons (*"Good game! 👏"*, *"Your turn! ⏳"*, *"Nice move! 🔥"*, *"Oops! 😅"*, *"Well played! 🏆"*).
- Color-coded player tags and unread badge notification counter.

---

## 🏗️ Project Architecture

```
ludo-online/
├── client/
│   ├── index.html          # Semantic HTML5 layout (Home, Lobby, Game Arena, Chat, Modals)
│   ├── style.css           # Glassmorphism design system, 15x15 board grid, 3D dice, animations
│   └── game.js             # Client Socket.IO controller, audio synthesizer, token animator
│
├── server/
│   ├── server.js           # Express app & Socket.IO server, static asset hosting, health checks
│   ├── gameManager.js      # Room lifecycle, player session tokens, reconnection, turn coordinator
│   └── ludoRules.js        # Authoritative Ludo rules, coordinate mappings, safe squares, captures
│
├── tests/
│   ├── gameSimulation.test.js  # Automated 4-player Socket.IO simulation test suite
│   └── liveServerTest.js       # Live server integration & HTTP health check test
│
├── package.json            # Project dependencies (Express, Socket.IO)
└── README.md               # Complete documentation & deployment guide
```

---

## 🚀 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 16 or higher)
- npm (installed with Node)

### Steps

1. **Clone or Navigate to the Project Directory**:
   ```bash
   cd c:\Users\bharathsai07\Downloads\anti
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Game Server**:
   ```bash
   npm start
   ```
   Output:
   ```
   🎲 Ludo Online server is running on port 3000
   🌐 Local access: http://localhost:3000
   ```

4. **Play**:
   - Open [http://localhost:3000](http://localhost:3000) in your web browser.
   - To test multiplayer locally, open multiple tabs or incognito browser windows:
     - **Tab 1**: Enter name, click **CREATE GAME**, copy the Room Code.
     - **Tab 2**: Enter name, click **JOIN GAME**, enter the Room Code.
     - **Tab 1**: Once 2–4 players join, the Host clicks **START GAME**!

5. **Run Automated Test Suites**:
   ```bash
   npm test
   ```

---

## 🌐 Playing with Friends on Different Devices (Local Network)

To play with friends on mobile phones, tablets, or laptops connected to the same Wi-Fi:

1. Find your computer's local IP address:
   - **Windows PowerShell**: `ipconfig` (look for `IPv4 Address`, e.g., `192.168.1.50`)
   - **macOS / Linux**: `ifconfig` or `ip a`
2. Share the URL with friends on the same Wi-Fi:
   ```
   http://192.168.1.50:3000
   ```
3. Players can open that URL in Safari, Chrome, Edge, or Firefox on their phones and join the game room!

---

## ☁️ Cloud Deployment (Internet Production)

The project is pre-configured for cloud platforms with environment variable support (`PORT`, `CORS_ORIGIN`) and a `/health` endpoint.

### Deploying to Render.com (Recommended Free / Low-Cost Hosting)
1. Push this repository to GitHub or GitLab.
2. Sign in to [Render](https://render.com/) and click **New + Web Service**.
3. Connect your repository.
4. Set the following settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/server.js`
   - **Environment Variables**:
     - `PORT`: `10000` (or leave default, Render sets `PORT` automatically)
     - `NODE_ENV`: `production`
5. Click **Create Web Service**. Render will build and provide a live public HTTPS URL (e.g., `https://ludo-online-xyz.onrender.com`).

### Deploying to Railway.app
1. Go to [Railway.app](https://railway.app/) and click **New Project** → **Deploy from GitHub Repo**.
2. Select your repository. Railway automatically detects `npm start` and sets up the port.
3. In **Settings** → **Networking**, click **Generate Domain** to get your public URL.

### Deploying to Fly.io
1. Install the flyctl CLI (`winget install flyctl` or `brew install flyctl`).
2. Run `fly launch` in the project root.
3. Run `fly deploy`.

---

## 📜 License

MIT License. Developed for open-source gaming and pair programming.
