// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.tsx';
import './Login.css';

// Define your API base URL for consistency
const API_BASE_URL = 'http://127.0.0.1:8000';

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      const apiUrl = isRegistering ? `${API_BASE_URL}/api/register/` : `${API_BASE_URL}/api/login/`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (isRegistering) {
          setSuccessMessage('Registration successful! You can now log in.');
          setIsRegistering(false);
          setUsername('');
          setPassword('');
          // Optional: automatically log in after registration if backend returns token
          if (data.token) {
              login(data.username, data.token);
              navigate('/dashboard');
          }
        } else {
          if (data.token) { // Ensure the token is in the response
            login(data.username, data.token); // Store token and username
            navigate('/dashboard'); // Redirect to dashboard
          } else {
            setError('Login successful, but no token received.');
            console.error('Login successful, but no token received:', data);
          }
        }
      } else {
        try {
          const errorData = await response.json();
          setError(errorData.message || errorData.detail || JSON.stringify(errorData));
          console.error("API Error during authentication:", errorData);
        } catch (jsonError) {
          setError(`Request failed with status: ${response.status}. Failed to parse error response.`);
          console.error("Failed to parse error response JSON:", jsonError);
          console.error("Raw response:", await response.text());
        }
      }
    } catch (err) {
      console.error('Network or API error during login/register:', err);
      setError('An unexpected error occurred. Please check your network connection or server status.');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="login-container">
        <div className="login-card">
          <h2>{isRegistering ? 'Register' : 'Login'}</h2>
          {error && <div className="error">{error}</div>}
          {successMessage && <div className="success">{successMessage}</div>}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <div className="toggle-mode">
            {isRegistering ? (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => setIsRegistering(false)}>Login</button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={() => setIsRegistering(true)}>Register</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;