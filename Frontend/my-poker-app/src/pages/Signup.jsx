import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Form, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import API from '../api/axios';

const SignupPage = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  let navigate = useNavigate();

  const signupUser = async (formData) => {
    try {
      const res = await API.post('/signup', formData);
      console.log('Signed up successfully:', res.data);
      navigate('/login'); // Redirect to login page after successful signup
      // TODO: Redirect to login page or show success message
    } catch (err) {
      console.error('Signup error:', err.response?.data?.error || err.message);
      alert('Username or email already exists! Please try again with different credentials.');
    }
  };

  // ✅ This handles the form submit
  const handleSignup = (e) => {
    e.preventDefault();

    signupUser({
      firstname: name,
      username,
      email,
      password
    });
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-dark text-white p-4">
      <h1 className="text-center mb-5 fw-bold display-4">
        Stack Track Signup
      </h1>

      <Container style={{ maxWidth: "500px" }}>
        <Card className="bg-secondary text-white p-4">
          <Form onSubmit={handleSignup}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-dark text-white"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-dark text-white"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-dark text-white"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-dark text-white"
              />
            </Form.Group>

            <div className="d-grid mb-3">
              <Button variant="success" type="submit">
                Sign Up
              </Button>
            </div>

            <div className="text-center">
              <span>Already have an account? </span>
              <Link to="/login" className="text-info">
                Login
              </Link>
            </div>
          </Form>
        </Card>
      </Container>
    </div>
  );
};

export default SignupPage;
