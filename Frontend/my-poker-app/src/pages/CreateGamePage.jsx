import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Row, Col, ListGroup } from "react-bootstrap";
import API from '../api/axios';
import {connectSocket, getSocket, setSocket } from '../socket';

const CreateGamePage = () => {
  const navigate = useNavigate();
  const [lobbyCode, setLobbyCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [startingChips] = useState(1000);
  let socketRef;
  const [currentUser, setCurrentUser] = useState(null);

  

  useEffect(() => {
    const initializeGame = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(user);
  
      const generatedCode = generateLobbyCode();
      setLobbyCode(generatedCode);
  
      try {
        if (!user) {
          alert('You must be logged in to create a game.');
          navigate('/login');
          return;
        }
  
        // Connect WebSocket
        connectSocket();
        const socket = getSocket();
  
        socket.onopen = () => {
          console.log('WebSocket connected (host)');
          const res = API.get(`/user/${user.id}`).then(response => {
            const registerMessage = JSON.stringify({
              type: 'register',
              userId: user.id,
              lobbyCode: generatedCode,
              username: user.username,
              balance: response.data.balance // 🛠 Send user balance
            });
    
            socket.send(registerMessage);
          });
        };
  
        socket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          console.log('Received:', message);
  
          if (message.type === 'player_joined') {
            console.log('Player joined lobby:', message.data);
  
            setPlayers((prevPlayers) => [...prevPlayers, message.data]);
          }
        };
  
        socket.onerror = (err) => {
          console.error('WebSocket error:', err);
        };
  
      } catch (err) {
        console.error('Error creating game:', err.response?.data?.error || err.message);
        alert('Failed to create game.');
      }
    };
  
    initializeGame();
  
    return () => {
      // NO socket.close() here
    };
  }, []);
  

  const generateLobbyCode = (length = 6) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      setPlayers([...players, { name: playerName, chips: startingChips }]);
      setPlayerName("");
    }
  };

  const handleStartGame = () => {
    const socket = getSocket();
  
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        type: 'start_game',
        lobbyCode
      }));
    } else {
      console.error('Socket not ready!');
    }
  
    navigate("/game/" + lobbyCode);
  };
  
  

  return (
    <div className="min-vh-100 bg-dark text-white d-flex flex-column justify-content-center align-items-center p-4">
      <Container style={{ maxWidth: "600px" }}>
        <Card className="bg-secondary text-white p-4 shadow-lg">
          <Card.Body>
            <h1 className="text-center mb-4">Create Game Lobby</h1>

            <div className="text-center mb-4">
              <p>Lobby Code:</p>
              <h3 className="font-monospace bg-dark py-2 px-4 rounded">{lobbyCode}</h3>
            </div>

            <h4 className="mb-3 text-center">Players:</h4>
            <ListGroup variant="flush" className="mb-4">
              {players.map((player, index) => (
                <ListGroup.Item
                  key={index}
                  className="bg-dark text-white d-flex justify-content-between align-items-center"
                >
                  {player.name}
                  <span className="text-success">💰 {player.chips}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>

            <Button
              variant="primary"
              size="lg"
              className="w-100"
              onClick={handleStartGame}
              disabled={players.length === 0}
            >
              Start Game
            </Button>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default CreateGamePage;
