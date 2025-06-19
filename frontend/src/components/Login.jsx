// src/components/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.tsx';
import './Login.css';
import ChatbotLogo from './cover.png'; // Corrected path from previous step

const API_BASE_URL = 'http://127.0.0.1:8000';

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Controls between login and register mode
  const navigate = useNavigate();

  // Handle login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          login(data.username, data.token);
          navigate('/dashboard');
        } else {
          setError('Login successful, but no authentication token received. Please try again.');
          console.error('Login successful, but no token received:', data);
        }
      } else {
        try {
          const errorData = await response.json();
          setError(errorData.message || errorData.detail || 'An unknown error occurred during login.');
          console.error("API Error during login:", errorData);
        } catch (jsonError) {
          setError(`Request failed with status: ${response.status}. Could not parse error details.`);
          console.error("Failed to parse error response JSON:", jsonError);
          console.error("Raw response:", await response.text());
        }
      }
    } catch (err) {
      console.error('Network or API error during login:', err);
      setError('Could not connect to the server. Please check your network connection or server status.');
    }
  };

  // Handle registration submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Registration successful! Please log in with your new credentials.');
        setIsRegistering(false); // Switch back to login mode
        setUsername('');
        setPassword('');
      } else {
        try {
          const errorData = await response.json();
          setError(errorData.message || errorData.detail || 'An unknown error occurred during registration.');
          console.error("API Error during registration:", errorData);
        } catch (jsonError) {
          setError(`Request failed with status: ${response.status}. Could not parse error details.`);
          console.error("Failed to parse error response JSON:", jsonError);
          console.error("Raw response:", await response.text());
        }
      }
    } catch (err) {
      console.error('Network or API error during registration:', err);
      setError('Could not connect to the server. Please check your network connection or server status.');
    }
  };

  // Function to toggle between login and register views
  const toggleFormMode = () => {
    setIsRegistering(!isRegistering);
    setError('');       // Clear messages on toggle
    setSuccessMessage(''); // Clear messages on toggle
    setUsername(''); // Clear fields on toggle
    setPassword(''); // Clear fields on toggle
  };

  // If the user is already authenticated, redirect them to the dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="login-container">
        {/* Place the logo directly inside login-container for independent positioning */}
        <img src={ChatbotLogo} alt="Chatbot Logo" className="chatbot-logo" /> 

        <div className={`login-card ${isRegistering ? 'register-mode' : 'login-mode'}`}>
          {/* Dynamic Welcome/Toggle Panel */}
          <div className="welcome-panel">
            <div className="welcome-content">
              {/* Removed img tag from here */}
              {isRegistering ? (
                <>
                  <h2 className="welcome-title">Welcome Back!</h2>
                  <p className="welcome-text">To keep connected with us, please login with your personal info.</p>
                  <button type="button" className="panel-toggle-btn" onClick={toggleFormMode}>Login</button>
                </>
              ) : (
                <>
                  <h2 className="welcome-title">Hello, Welcome!</h2>
                  <p className="welcome-text">Enter your personal details to join our community.</p>
                  <button type="button" className="panel-toggle-btn" onClick={toggleFormMode}>Register</button>
                </>
              )}
            </div>
          </div>

          {/* Static Form Panel */}
          <div className="form-panel">
            {/* Display title based on mode (inside the form panel) */}
            <h2 className="form-title">{isRegistering ? 'Create Account' : 'Sign in'}</h2>

            {/* Display error or success messages */}
            {error && <div className="error">{error}</div>}
            {successMessage && <div className="success">{successMessage}</div>}

            {/* Login Form */}
            <div className={`form-content ${!isRegistering ? 'active-form' : 'inactive-form'}`}>
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group-item">
                  <label htmlFor="login-username">Username</label>
                  <input
                    type="text"
                    id="login-username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group-item">
                  <label htmlFor="login-password">Password</label>
                  <input
                    type="password"
                    id="login-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <a href="#" className="forgot-password">Forgot Password?</a>
                <button type="submit">Login</button>
              </form>
            </div>

            {/* Registration Form */}
            <div className={`form-content ${isRegistering ? 'active-form' : 'inactive-form'}`}>
              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group-item">
                  <label htmlFor="register-username">Username</label>
                  <input
                    type="text"
                    id="register-username"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group-item">
                  <label htmlFor="register-password">Password</label>
                  <input
                    type="password"
                    id="register-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit">Register</button>
              </form>
            </div>

            {/* Social Login Options (Optional, if you want to implement them later) */}
            <div className="social-login">
              <p>or login with social platforms</p>
              <div className="social-icons">
                <button className="social-btn google">G</button>
                <button className="social-btn facebook">f</button>
                <button className="social-btn linkedin">in</button>
                <button className="social-btn github">O</button> {/* Added GitHub icon placeholder */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;