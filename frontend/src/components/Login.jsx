// src/components/Login.jsx
import React, { useState } from 'react'; // Removed useEffect as it's no longer needed for CSRF token fetching
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.tsx';
import './Login.css';

// Define your API base URL for consistency
const API_BASE_URL = 'http://127.0.0.1:8000';

// getCookie is no longer needed in Login.jsx for authentication tokens
// You can remove this function entirely if no other part of Login.jsx uses it.
// const getCookie = (name) => { ... };

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  // No useEffect needed here for fetching CSRF token.
  // Token authentication doesn't rely on CSRF cookies being set for authentication.

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

      // With token auth, we don't send CSRF token for login/register POSTs directly,
      // as they are typically public endpoints designed to issue a token.
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        // credentials: 'include' is not strictly necessary for token auth login/register
        // as we are not relying on session cookies being sent/received by the browser.
        // However, keeping it doesn't hurt.
        // credentials: 'include',
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
