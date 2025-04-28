import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Spinner } from "react-bootstrap";
import { connectSocket, getSocket } from '../socket';
import API from '../api/axios'; // 🛠 Import your API caller
const JoinGamePage = () => {
  const { lobbyCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    let socket = getSocket();
    let balance;
    if (!user) {
      alert('You must be logged in!');
      navigate('/login');
      return;
    }
    if(!socket) {
      connectSocket();
      socket = getSocket();
    }

    // 🧹 Remove old handler
    socket.onmessage = null;

    // 🧹 Remove old onopen
    socket.onopen = null;

    socket.onopen = () => {
      console.log('WebSocket connected (joining player)');
      const res = API.get(`/user/${user.id}`).then(response => {
        socket.send(JSON.stringify({
          type: 'join_lobby',
          userId: user.id,
          username: user.username,
          lobbyCode,
          balance: response.data.balance // 🛠 Send user balance
        }));
      }).catch(err => {
        console.error('Failed to fetch user data:', err);
        alert('Failed to join lobby. Please try again later.');
        navigate('/');
      });
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received:', message);

      if (message.type === 'game_started') {
        navigate(`/game/${lobbyCode}`);
      }
    };

    return () => {
      // Clean listeners but do NOT close socket
      socket.onmessage = null;
      socket.onopen = null;
    };
  }, [lobbyCode, navigate]);

  return (
    <div className="min-vh-100 bg-dark text-white d-flex flex-column justify-content-center align-items-center p-4">
      <Container style={{ maxWidth: "600px" }}>
        <Card className="bg-secondary text-white p-5 shadow-lg text-center">
          <h1 className="fw-bold mb-4">Joined Lobby</h1>
          <h3 className="font-monospace bg-dark py-2 px-4 rounded mb-4">{lobbyCode}</h3>
          <p className="mb-4">Waiting for the host to start the game...</p>
          <div className="d-flex justify-content-center">
            <Spinner animation="border" variant="light" />
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default JoinGamePage;
