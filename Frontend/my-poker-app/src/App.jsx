import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CreateGamePage from "./pages/CreateGamePage";
import JoinGamePage from "./pages/JoinGamePage";
import GameScreen from "./pages/GameScreen";
import LoginSignupPage from "./pages/LoginSignupPage";
import SignupPage from "./pages/Signup";
import { connectSocket } from './socket';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {

  connectSocket();
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignupPage/>} />
        <Route path="/create" element={<CreateGamePage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/join/:lobbyCode" element={<JoinGamePage />} />
        <Route path="/game/:lobbyCode" element={<GameScreen />} />
        <Route path="/login" element={<LoginSignupPage/>} />
        <Route path="/signup" element={<SignupPage/>} />
      </Routes>
    </Router>
  );
}

export default App;