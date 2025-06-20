// src/components/LoginPage.jsx
import React from 'react';
import LoginCard from './Login';
import './LoginPage.css';
import CoverImage from './logo.png'; // Make sure you have this image in the same folder

const LoginPage = () => {
  return (
    <div className="login-page-container">
      <div className="left-column">
        <LoginCard />
      </div>
      <div className="right-column">
        <div className="welcome-container">
          <img src={CoverImage} alt="Logo" className="welcome-logo" />
          <h1 className="welcome-title">Welcome to our project</h1>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
