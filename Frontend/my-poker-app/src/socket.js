// src/socket.js

let socket = null;

export function connectSocket(url = 'ws://localhost:3001') {
  if (!socket || socket.readyState >= 2) { // 2 = CLOSING, 3 = CLOSED
    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
      console.log('✅ WebSocket connected');
    });

    socket.addEventListener('close', () => {
      console.log('❌ WebSocket closed');
    });

    socket.addEventListener('error', (error) => {
      console.error('⚠️ WebSocket error:', error);
    });

    window._globalSocket = socket; // optional
  } else {
    console.log('✅ WebSocket already connected');
  }

  return socket;
}

export function getSocket() {
  return socket || window._globalSocket;
}

export function disconnectSocket() {
  if (socket) {
    socket.close();
    socket = null;
    window._globalSocket = null;
  }
}
