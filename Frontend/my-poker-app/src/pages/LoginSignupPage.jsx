import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import API from '../api/axios'; // ✅ make sure you have this to call backend

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // ✅ needed to redirect after login

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post('/login', { email, password });
      console.log('Logged in successfully:', res.data);

      // Save user info in localStorage (or app state)
      localStorage.setItem('user', JSON.stringify(res.data));

      // Redirect to Create Game page or Home
      navigate('/landing'); // or whatever page you want after login
    } catch (err) {
      console.error('Login error:', err.response?.data?.error || err.message);
      alert('Invalid email or password! Please try again.');
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-dark text-white p-4">
      <h1 className="text-center mb-5 fw-bold display-4">
        Welcome to Stack Track
      </h1>

      <Container style={{ maxWidth: "900px" }}>
        <Card className="bg-secondary text-white">
          <Card.Body>
            <Row className="align-items-center">
              {/* Left side: Login Form */}
              <Col md={6} className="border-end border-light p-4">
                <h3 className="text-center mb-4">Login</h3>
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-dark text-white"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-dark text-white"
                      required
                    />
                  </Form.Group>

                  <div className="d-grid">
                    <Button variant="success" type="submit">
                      Login
                    </Button>
                  </div>
                </Form>
              </Col>

              {/* Right side: Link to Signup */}
              <Col md={6} className="text-center p-4">
                <h3 className="mb-4">New Here?</h3>
                <p className="mb-4">Create an account to start playing Stack Track!</p>
                <Link to="/signup">
                  <Button variant="success" size="lg">
                    Sign Up
                  </Button>
                </Link>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default LoginPage;
