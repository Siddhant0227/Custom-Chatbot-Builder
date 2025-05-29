import React from 'react';
import './WelcomeScreen.css'; // Ensure App.css is imported for styles

interface WelcomeScreenProps {
  onStartBuilding: () => void; // Callback function to trigger navigation
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartBuilding }) => {
  return (
    <div className="welcome-overlay">
      <div className="welcome-content">
        <h1 className="welcome-title">Build Your Codeless Chatbot</h1>
        <p className="welcome-subtitle">Create powerful conversational AI with ease.</p>
        <button className="btn btn-start-builder" onClick={onStartBuilding}>
          Start Building Your Chatbot
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;