import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Form, Card } from "react-bootstrap";
import { disconnectSocket } from "../socket";
import NavigationBar from '../components/NavigationBar';

const LandingPage = () => {
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate(); // ✅ Needed for handling dynamic redirects

  const handleJoin = (e) => {
    e.preventDefault();

    if (joinCode.trim() !== "") {
      navigate(`/join/${joinCode}`);
    } else {
      alert('Please enter a valid lobby code!');
    }
  };

  useEffect(() => {
    disconnectSocket();
  }, [navigate]);

  return (
    <div className="min-vh-100 bg-dark text-white">
    <NavigationBar />
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-dark text-white p-4">
      <h1 className="text-center mb-5 fw-bold display-4">
        Welcome to Stack Track
      </h1>

      <Container style={{ maxWidth: "900px" }}>
        <Card className="bg-secondary text-white">
          <Card.Body>
            <Row className="align-items-center">
              {/* Left Side - Create a Game */}
              <Col md={6} className="text-center border-end border-light">
                <h3 className="mb-4">Create a Game</h3>
                <Link to="/create">
                  <Button variant="success" size="lg">
                    Create
                  </Button>
                </Link>
              </Col>

              {/* Right Side - Join a Game */}
              <Col md={6} className="text-center">
                <h3 className="mb-4">Join a Game</h3>
                <Form onSubmit={handleJoin} className="d-flex justify-content-center align-items-center gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Enter Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="bg-dark text-white"
                    style={{ maxWidth: "200px" }}
                  />
                  <Button variant="success" type="submit">
                    Join
                  </Button>
                </Form>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
    </div>
  );
};

export default LandingPage;
