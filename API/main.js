// src/main.js
const express = require('express');
const http = require('http');
const { Server } = require('ws');
require('dotenv').config();
const { Connection } = require('./models'); // Auto-load models
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

const lobbies = new Map();

app.use(cors({
  origin: JSON.parse(process.env.CORS_ORIGIN),
  credentials: true
}));

app.use(express.json());

// --- WebSocket Utility Functions ---

function advanceTurn(lobbyCode) {
  const lobby = lobbies.get(lobbyCode);
  if (!lobby) return;

  const players = Array.from(lobby.players.keys());
  if (players.length === 0) return;

  let currentIndex = players.indexOf(lobby.currentTurnUserId);

  let nextIndex = (currentIndex + 1) % players.length;
  let nextUserId = players[nextIndex];

  // 🚀 Loop until we find a player who hasn't folded
  while (lobby.players.get(nextUserId)?.folded) {
    nextIndex = (nextIndex + 1) % players.length;
    nextUserId = players[nextIndex];
  }

  lobby.currentTurnUserId = nextUserId;

  broadcastToLobby(lobbyCode, {
    type: 'turn_update',
    userId: nextUserId
  });
}


function broadcastToLobby(lobbyCode, message) {
  const lobby = lobbies.get(lobbyCode);
  if (!lobby) return;

  const messageString = JSON.stringify(message);

  for (const ws of lobby.sockets.values()) {
    if (ws.readyState === 1) {
      ws.send(messageString);
    }
  }
}

// --- WebSocket Events ---

wss.on('connection', (ws) => {
  console.log('New WebSocket connection.');

  ws.on('message', (message) => {
    const parsed = JSON.parse(message);
    console.log('Received message:', parsed);

    if (parsed.type === 'join_lobby') {
      const { userId, username, lobbyCode, balance } = parsed;
    
      if (!lobbies.has(lobbyCode)) {
        lobbies.set(lobbyCode, {
          players: new Map(),
          sockets: new Map(),
          communityCards: [
            { value: "", suit: "" },
            { value: "", suit: "" },
            { value: "", suit: "" },
            { value: "", suit: "" },
            { value: "", suit: "" }
          ],
          creatorId: userId,
          currentTurnUserId: null
        });
      }
    
      const lobby = lobbies.get(lobbyCode);
    
      lobby.players.set(userId, {
        username,
        chips: balance,
        joinedAt: Date.now() // 🔥 track join time!
      });
      lobby.sockets.set(userId, ws);
    
      ws.lobbyCode = lobbyCode;
      ws.userId = userId;
      ws.username = username;
    
      broadcastToLobby(lobbyCode, {
        type: 'player_joined',
        data: { name: username, chips: balance }
      });
    
      console.log(`User ${userId} (${username}) joined lobby ${lobbyCode}`);
    }
    

    if (parsed.type === 'get_current_turn') {
      const { lobbyCode } = parsed;

      if (lobbies.has(lobbyCode)) {
        const lobby = lobbies.get(lobbyCode);

        if (lobby.turnOrder && lobby.turnOrder.length > 0) {
          const currentIndex = lobby.currentTurnIndex || 0;
          const currentPlayerId = lobby.turnOrder[currentIndex];

          ws.send(JSON.stringify({
            type: 'current_turn',
            userId: currentPlayerId
          }));

        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Turn order not established yet.'
          }));
        }

      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Lobby not found.'
        }));
      }
    }

    if (parsed.type === 'register') {
      const { userId, username, lobbyCode, balance } = parsed;

      if (!lobbies.has(lobbyCode)) {
        lobbies.set(lobbyCode, {
          players: new Map(),
          sockets: new Map(),
          communityCards: [
            { value: "", suit: "" },
            { value: "", suit: "" },
            { value: "", suit: "" },
            { value: "", suit: "" },
            { value: "", suit: "" }
          ],
          creatorId: userId,
          currentTurnUserId: null
        });
      }

      const lobby = lobbies.get(lobbyCode);
      lobby.players.set(userId, { username, chips: balance });
      lobby.sockets.set(userId, ws);

      ws.lobbyCode = lobbyCode;
      ws.userId = userId;
      ws.username = username;

      console.log(`Host ${userId} (${username}) registered to lobby ${lobbyCode}`);
    }

    if (parsed.type === 'start_game') {
      const { lobbyCode } = parsed;
      const lobby = lobbies.get(lobbyCode);
    
      if (lobby) {
        broadcastToLobby(lobbyCode, {
          type: 'game_started',
          players: Array.from(lobby.players.values())
        });
    
        const playersArray = Array.from(lobby.players.entries());
        playersArray.sort((a, b) => a[1].joinedAt - b[1].joinedAt);
    
        lobby.turnOrder = playersArray.map(([userId, info]) => userId);
        lobby.currentTurnIndex = 0;
        lobby.currentTurnUserId = lobby.turnOrder[0];
    
        console.log(`First player for lobby ${lobbyCode}: ${lobby.currentTurnUserId}`);
    
        broadcastToLobby(lobbyCode, {
          type: 'turn_update',
          userId: lobby.currentTurnUserId
        });
      }
    }

    if (parsed.type === 'get_game_state') {
      const { lobbyCode } = parsed;
      const lobby = lobbies.get(lobbyCode);

      if (lobby) {
        const players = Array.from(lobby.players.entries()).map(([userId, info]) => ({
          userId,
          username: info.username,
          chips: info.chips
        }));

        ws.send(JSON.stringify({
          type: 'game_state',
          players,
          communityCards: lobby.communityCards,
          gameCreatorId: lobby.creatorId
        }));
      }
    }

    if (parsed.type === 'bet') {
      const { lobbyCode, userId, amount } = parsed;
      const lobby = lobbies.get(lobbyCode);
      const playerSocket = lobby?.sockets.get(userId);
    
      if (playerSocket && lobby.currentTurnUserId === userId) {
        const playerInfo = lobby.players.get(userId);
    
        if (playerInfo) {
          const highestBet = Math.max(
            0,
            ...Array.from(lobby.players.values())
              .filter(p => !p.folded) // only active players
              .map(p => p.currentRoundBet || 0)
          );
    
          const playerTotalBet = (playerInfo.currentRoundBet || 0) + amount;
    
          if (playerTotalBet < highestBet) {
            // ❌ If they bet LESS than the current highest bet -> reject
            playerSocket.send(JSON.stringify({
              type: 'error',
              message: `You must at least match the current highest bet of ${highestBet} chips!`
            }));
            return; // stop the bet
          }
    
          // ✅ Otherwise, accept the bet
          playerInfo.chips -= amount;
          playerInfo.currentRoundBet = playerTotalBet;
    
          lobby.pot = (lobby.pot || 0) + amount;
    
          broadcastToLobby(lobbyCode, {
            type: 'bet_made',
            userId,
            username: playerSocket.username,
            amount
          });
    
          advanceTurn(lobbyCode);
        }
      } else {
        playerSocket?.send(JSON.stringify({ type: 'error', message: 'Not your turn to bet.' }));
      }
    }

    if (parsed.type === 'check') {
      const { lobbyCode, userId } = parsed;
      const lobby = lobbies.get(lobbyCode);
      const playerSocket = lobby?.sockets.get(userId);

      if (playerSocket && lobby.currentTurnUserId === userId) {
        broadcastToLobby(lobbyCode, {
          type: 'player_checked',
          userId,
          username: playerSocket.username
        });
        advanceTurn(lobbyCode);
      } else {
        playerSocket?.send(JSON.stringify({ type: 'error', message: 'Not your turn to check.' }));
      }
    }

    if (parsed.type === 'fold') {
      const { lobbyCode, userId } = parsed;
      const lobby = lobbies.get(lobbyCode);
    
      if (lobby) {
        const playerSocket = lobby.sockets.get(userId);
        const playerInfo = lobby.players.get(userId);
    
        if (playerSocket && playerInfo) {
          // ✅ Mark player as folded
          playerInfo.folded = true;
    
          broadcastToLobby(lobbyCode, {
            type: 'player_folded',
            userId,
            username: playerInfo.username
          });
    
          // ✅ Check if only one player remains who didn't fold
          const activePlayers = Array.from(lobby.players.entries())
            .filter(([id, info]) => !info.folded)
            .map(([id]) => id);
    
          if (activePlayers.length === 1) {
            // 🎉 Someone won!
    
            const winnerId = activePlayers[0];
            const winner = lobby.players.get(winnerId);
    
            const totalPot = lobby.pot || 0;
            winner.chips += totalPot; // 💰 Give them the pot
    
            broadcastToLobby(lobbyCode, {
              type: 'winner_declared',
              winnerId: winnerId,
              winnerName: winner.username,
              winnings: totalPot
            });
    
            // 🛠 Reset the board

            for (const player of lobby.players.values()) {
              player.folded = false;
              player.currentRoundBet = 0; // ✅ reset their round bets
            }

            lobby.pot = 0;
            lobby.communityCards = [
              { value: "", suit: "" },
              { value: "", suit: "" },
              { value: "", suit: "" },
              { value: "", suit: "" },
              { value: "", suit: "" }
            ];
    
            // Reset fold status for next round
            for (const player of lobby.players.values()) {
              player.folded = false;
            }
    
            // Reset turn order
            lobby.turnOrder = Array.from(lobby.players.keys());
            lobby.currentTurnIndex = 0;
            lobby.currentTurnUserId = lobby.turnOrder[0];
    
            // ✨ Broadcast reset board + players with correct chips
            broadcastToLobby(lobbyCode, {
              type: 'reset_board',
              players: Array.from(lobby.players.entries()).map(([id, info]) => ({
                userId: id,
                username: info.username,
                chips: info.chips
              })),
              communityCards: lobby.communityCards,
              pot: lobby.pot
            });
    
            // ✨ Send turn update for next round
            broadcastToLobby(lobbyCode, {
              type: 'turn_update',
              userId: lobby.currentTurnUserId
            });
    
          } else {
            // ✅ Otherwise, just move to the next turn
            advanceTurn(lobbyCode);
          }
        }
      }
    }
    

    if (parsed.type === 'update_table_cards') {
      const { lobbyCode, communityCards } = parsed;
      const lobby = lobbies.get(lobbyCode);

      if (lobby) {
        lobby.communityCards = communityCards;
        broadcastToLobby(lobbyCode, {
          type: 'table_cards_update',
          communityCards
        });
      }
    }

    if (parsed.type === 'quit_game') {
      const { lobbyCode, userId } = parsed;
      const lobby = lobbies.get(lobbyCode);
      const players = Array.from(lobby.players.entries()).map(([userId, info]) => ({
        userId,
        username: info.username,
        chips: info.chips
      }));
      console.log(lobby, 'players left in lobby', lobbyCode);
      if (lobby) {
        lobby.players.delete(userId);
        lobby.sockets.delete(userId);
    
        // Check if the quitting user is the creator
        if (lobby.creatorId === userId) {
          // 💥 Creator left! Close the whole lobby
          broadcastToLobby(lobbyCode, {
            type: 'lobby_closed',
            players: players,
            reason: 'Host has left the game.'
          });
        } else {
          // Normal player quit
          broadcastToLobby(lobbyCode, {
            type: 'player_quit',
            userId
          });
          if (lobby.players.size === 0) {
            lobbies.delete(lobbyCode);
          }
        }
      }
    }
    
    
    
  });

  ws.on('close', () => {
    const { lobbyCode, userId } = ws;

    if (lobbyCode && lobbies.has(lobbyCode)) {
      const lobby = lobbies.get(lobbyCode);
      lobby.players.delete(userId);
      lobby.sockets.delete(userId);

      if (lobby.players.size === 0) {
        lobbies.delete(lobbyCode);
      }

      console.log(`User ${userId} disconnected from lobby ${lobbyCode}`);
    }
  });
});

// --- Express API Routes ---
app.use('/api', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));
app.use('/api/user', require('./routes/user'));
app.use('/api/ai', require('./routes/ai')); // AI routes
app.use('/api/transaction', require('./routes/transaction')); // AI routes
// --- Server Startup ---
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  try {
    await Connection.authenticate();
    console.log('✅ Database connected successfully!');
    await Connection.sync({ alter: true });
    console.log('✅ Models synced!');
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
  console.log(`🚀 Server + WebSocket running at http://localhost:${PORT}`);
});
