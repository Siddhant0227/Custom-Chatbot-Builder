import React from 'react';
import './WelcomeScreen.css';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleStartBuilding = () => {
    navigate('/build'); // navigate to your chatbot builder page
  };

  return (
    <div className="welcome-overlay">
      <div className="welcome-content">
        <h1 className="welcome-title">Build Your Codeless Chatbot</h1>
        <p className="welcome-subtitle">Create powerful conversational AI with ease.</p>
        <button className="btn btn-start-builder" onClick={handleStartBuilding}>
          Start Building Your Chatbot
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
