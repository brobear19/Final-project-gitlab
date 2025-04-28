// src/pages/GamePage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Container, Row, Col, Button, Card, Form, ListGroup } from "react-bootstrap";
import API from '../api/axios';
import { getSocket } from '../socket';

const cardValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const cardSuits = ['♠️', '♥️', '♦️', '♣️'];

const CardSelector = ({ card, onChange }) => {



  return (
    <div className="d-flex flex-column align-items-center mb-3">
      <div className="d-flex flex-wrap justify-content-center mb-2">
        {cardValues.map((val) => (
          <Button
            key={val}
            variant={card.value === val ? "success" : "outline-light"}
            size="sm"
            className="m-1"
            onClick={() => onChange({ ...card, value: val })}
          >
            {val}
          </Button>
        ))}
      </div>
      <div className="d-flex justify-content-center">
        {cardSuits.map((suit) => (
          <Button
            key={suit}
            variant={card.suit === suit ? "success" : "outline-light"}
            size="sm"
            className="m-1"
            onClick={() => onChange({ ...card, suit })}
          >
            {suit}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default function GamePage() {

  const location = useLocation();
  const { lobbyCode } = useParams();
  const socketRef = getSocket();

  const { code } = useParams();
  const [playerHand, setPlayerHand] = useState([
    { value: "", suit: "" },
    { value: "", suit: "" }
  ]);
  const [communityCards, setCommunityCards] = useState([
    { value: "", suit: "" },
    { value: "", suit: "" },
    { value: "", suit: "" },
    { value: "", suit: "" },
    { value: "", suit: "" }
  ]);
  const [chips, setChips] = useState(1000);
  const [betAmount, setBetAmount] = useState("");
  const [pot, setPot] = useState(0);
  const [history, setHistory] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [gameCreatorId, setGameCreatorId] = useState(null);
  const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);


  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!socketRef) return;

    // Ask server for full game state
    socketRef.send(JSON.stringify({
      type: 'get_game_state',
      lobbyCode
    }));

    socketRef.send(JSON.stringify({
      type: 'get_current_turn',
      lobbyCode
    }));

    socketRef.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received from server:', message);

      if (message.type === 'game_state') {
        setPlayers(message.players);
        setCommunityCards(message.communityCards);
        setGameCreatorId(message.gameCreatorId);

        // Check if this client is host
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.id === message.gameCreatorId) {
          setIsHost(true);
        }

      }

      if (message.type === 'bet_made') {
        let savedbid = currentBid + message.amount;
        setCurrentBid(savedbid);
        setHistory(prev => [...prev, `${message.username} bet ${message.amount} chips`]);
        setPot(prevPot => prevPot + message.amount);
        setPlayers(prevPlayers => prevPlayers.map(player =>
          player.userId === message.userId
            ? {
              ...player,
              chips: player.chips - message.amount,
              currentRoundBet: (player.currentRoundBet || 0) + message.amount // ✅ ALSO update currentRoundBet
            }
            : player
        ));
      }

      if (message.type === 'player_checked') {
        setHistory(prev => [...prev, `${message.username} checked`]);
      }

      if (message.type === 'reset_board') {
        console.log('Board is resetting...', message);

        setCommunityCards(message.communityCards || [
          { value: "", suit: "" },
          { value: "", suit: "" },
          { value: "", suit: "" },
          { value: "", suit: "" },
          { value: "", suit: "" }
        ]);

        if (message.players) {
          setPlayers(message.players); // ✅ Use updated players with new chips
        }

        setPot(message.pot || 0); // ✅ Reset pot to 0
        setHistory([]); // ✅ Clear action history
        setCurrentBid(0); // ✅ Reset current bid
      }

      if (message.type === 'player_quit') {
        const { userId, username } = message;
      
        setPlayers(prevPlayers => prevPlayers.filter(player => player.userId !== userId));
        setHistory(prevHistory => [`${username} has left the game`, ...prevHistory]);
      }

      if (message.type === 'player_folded') {
        setHistory(prev => [...prev, `${message.username} folded`]);

        setPlayers(prevPlayers =>
          prevPlayers.map(player =>
            player.userId === message.userId
              ? { ...player, folded: true } // ✅ Just mark folded
              : player
          )
        );
      }

      if (message.type === 'turn_update' || message.type === 'current_turn') {
        setCurrentTurnUserId(message.userId);
      }

      if (message.type === 'table_cards_update') {
        if (!isHost) {
          setCommunityCards(message.communityCards);
        }
      }
      if (message.type === 'lobby_closed') {

        //const foundPlayer = players.find(p => p.userId === user.id);
        //const cachedChips = foundPlayer?.chips ?? 0;
        console.log('Cached Chips:', players);
        handleQuitGame(message.players);
      }
      

    };
  }, [lobbyCode]);


  const handleBet = () => {
    const amount = Number(betAmount);

    if (amount > 0 && amount <= chips && socketRef) {
      socketRef.send(JSON.stringify({
        type: 'bet',
        lobbyCode,
        userId: user.id,
        username: user.username,
        amount
      }));

      // 👇 Set the new currentBid locally
      setCurrentBid(0);

      setBetAmount(""); // Clear bet input
    }
  };


  const handleCheck = () => {
    if (socketRef) {
      socketRef.send(JSON.stringify({
        type: 'check',
        lobbyCode,
        username: user.username,
        userId: user.id
      }));
    }
  };

  const handleFold = () => {
    if (socketRef) {
      socketRef.send(JSON.stringify({
        type: 'fold',
        lobbyCode,
        username: user.username,
        userId: user.id
      }));
    }
  };

  const handleQuitGame = async (serverPlayers = null) => {
    if (!socketRef) return;
    console.log('serverPlayers:', serverPlayers);
    try {
      // Step 1: Fetch latest balance from server
      const serverRes = await API.get(`/user/${user.id}`);
      const serverBalance = serverRes.data.balance;
      let gameBalance = 0;
      // Step 2: Calculate difference
      if(serverPlayers._reactName === 'onClick'){
        const foundPlayer = players.find(p => p.userId === user.id);
        gameBalance = foundPlayer?.chips ?? 0;
      }else{
        const foundPlayer = serverPlayers.find(p => p.userId === user.id);
        gameBalance = foundPlayer?.chips ?? 0;
      }
      
  
      const netChange = gameBalance - serverBalance;
  
      console.log('Server Balance:', serverBalance);
      console.log('Game Balance:', gameBalance);
      console.log('Net Change:', netChange);
      console.log('players:', players);
  
      // Step 3: Record a transaction if needed
      if (netChange !== 0) {
        await API.post('/transaction', {
          userId: user.id,
          type: netChange > 0 ? 'win' : 'loss',
          amount: Math.abs(netChange)
        });
  
        // Update user balance on server
        await API.patch(`/user/${user.id}`, { balance: gameBalance });
      }
  
      // Step 4: Send quit message
      socketRef.send(JSON.stringify({
        type: 'quit_game',
        lobbyCode,
        userId: user.id,
        username: user.username
      }));
      if(serverPlayers._reactName !== 'onClick'){
        alert('The host has ended the game. Returning to landing page.');
      }
      // Step 5: Redirect
      window.location.href = '/landing';
  
    } catch (error) {
      console.error('Error handling quit:', error);
      alert('Failed to properly quit game.');
    }
  };
  
  



  const handleRecommendMove = async () => {
    try {
      const handString = playerHand.map(card => `${card.value}${card.suit}`).join(',');
      const communityString = communityCards.map(card => `${card.value}${card.suit}`).join(',');

      const response = await fetch(`http://localhost:3001/api/ai/recommend?playerChips=${chips}&pot=${pot}&currentBid=${currentBid}&hand=${handString}&communityCards=${communityString}`);
      const data = await response.json();

      if (data.move) {
        alert(`AI recommends you to: ${data.move.toUpperCase()}`);
      } else {
        alert('AI could not decide a move.');
      }
    } catch (error) {
      console.error('Failed to get recommendation:', error);
      alert('Error fetching recommendation.');
    }
  };


  return (
    <div className="min-vh-100 bg-dark text-white p-4">
      <Container>

        <h1 className="text-center mb-5">Game Lobby: {code}</h1>

        {/* Players */}
        <h3 className="text-center mb-4">Players</h3>
        <ListGroup horizontal className="justify-content-center mb-5">
          {players.map((player, index) => (
            <ListGroup.Item
              key={index}
              className={`m-2 text-white ${player.folded ? "bg-secondary opacity-50" : "bg-secondary"} ${currentTurnUserId === player.userId ? "border border-success" : ""}`}
              style={{ minWidth: "150px", textAlign: "center" }}
            >
              <div>{player.username}</div>
              <div>{player.chips} chips</div>
              <div style={{ fontSize: "small", opacity: 0.8 }}>
                Bet this round: {player.currentRoundBet || 0}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>



        {/* Community Cards */}
        <h3 className="text-center mb-4">Community Cards</h3>
        <Row className="justify-content-center mb-5">
          {communityCards.map((card, index) => (
            <Col key={index} xs="auto" className="mb-4">
              <Card bg="secondary" text="white" className="p-2">
                <Card.Body className="text-center">
                  <Card.Title>Card {index + 1}</Card.Title>

                  {isHost ? (
                    <CardSelector
                      card={card}
                      onChange={(newCard) => {
                        const updated = [...communityCards];
                        updated[index] = newCard;
                        setCommunityCards(updated);

                        if (isHost && socketRef) {
                          socketRef.send(JSON.stringify({
                            type: 'update_table_cards',
                            lobbyCode,
                            communityCards: updated
                          }));
                        }
                      }}

                    />
                  ) : (
                    <div className="text-xl">
                      {card.value} {card.suit}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>


        {/* Your Hand */}
        <h3 className="text-center mb-4">Your Hand</h3>
        <Row className="justify-content-center mb-5">
          {playerHand.map((card, index) => (
            <Col key={index} xs="auto" className="mb-4">
              <Card bg="secondary" text="white" className="p-2">
                <Card.Body className="text-center">
                  <Card.Title>Card {index + 1}</Card.Title>
                  <CardSelector
                    card={card}
                    onChange={(newCard) => {
                      const updated = [...playerHand];
                      updated[index] = newCard;
                      setPlayerHand(updated);
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Pot and Betting */}
        <div className="text-center mb-5">
          <h3>Pot: {pot} chips</h3>
          <h4>Current Bid: {currentBid} chips</h4>
          <Form.Group className="d-flex justify-content-center align-items-center mb-4 mt-4">
            <Form.Control
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Enter bet"
              style={{ width: "150px" }}
              className="me-3 bg-dark text-white"
            />
          </Form.Group>

          {/* Action Buttons */}
          {currentTurnUserId === user.id && !players.find(p => p.userId === user.id)?.folded && (
            <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
              <Button variant="primary" onClick={handleCheck}>Check</Button>
              <Button variant="danger" onClick={handleFold}>Fold</Button>
              <Button variant="success" onClick={handleBet}>Bet</Button>
            </div>
          )}


          {/* Recommended Move and Quit */}
          <div className="d-flex flex-column align-items-center gap-3">
            <Button variant="warning" size="lg" onClick={handleRecommendMove}>
              Recommended Move
            </Button>

            <Button variant="danger" size="lg" onClick={handleQuitGame}>
              Quit Game
            </Button>
          </div>

        </div>

        {/* History */}
        <h3 className="text-center mb-4">Action History</h3>
        <ListGroup>
          {[...history].reverse().map((entry, idx) => (
            <ListGroup.Item key={idx} className="bg-secondary text-white">
              {entry}
            </ListGroup.Item>
          ))}
        </ListGroup>


      </Container>
    </div>
  );
}
