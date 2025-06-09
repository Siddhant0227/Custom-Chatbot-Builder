// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.tsx';
import './Login.css';

// Define your API base URL for consistency
// IMPORTANT: Ensure this matches how your Django server is actually running (localhost vs 127.0.0.1)
const API_BASE_URL = 'http://127.0.0.1:8000';

// Helper function to get CSRF token from cookies
const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  // useEffect to fetch CSRF token on component mount
  // This sends an initial GET request to Django to ensure the 'csrftoken' cookie is set in the browser.
  // This is crucial for subsequent POST requests that require CSRF token.
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        // Hitting a simple Django endpoint like '/' or '/api/' which the WelcomeView handles
        // will trigger Django's CSRF middleware to set the csrftoken cookie.
        const response = await fetch(`${API_BASE_URL}/api/`, {
          method: 'GET',
          credentials: 'include', // Important: Tells the browser to send/accept cookies
        });
        if (response.ok) {
          console.log("Initial GET to Django backend performed to get CSRF token.");
          // At this point, the csrftoken cookie should be available in document.cookie
        } else {
          console.error("Failed initial GET to Django backend:", response.status);
          // You might want to display a user-friendly error about backend connectivity
        }
      } catch (err) {
        console.error("Network error during initial CSRF token fetch:", err);
        setError("Could not connect to the backend to initialize. Please check server status.");
      }
    };

    fetchCsrfToken();
  }, []); // Empty dependency array ensures this effect runs only once on mount

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
      const csrftoken = getCookie('csrftoken'); // Now, this should successfully retrieve the token!
      console.log('CSRF Token being sent (Login/Register):', csrftoken); // Debugging line

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken || '', // Include CSRF token in header for POST requests
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Crucial: Ensures cookies are sent with cross-origin requests
      });

      if (response.ok) {
        const data = await response.json();
        if (isRegistering) {
          setSuccessMessage('Registration successful! You can now log in.');
          setIsRegistering(false);
          setUsername('');
          setPassword('');
        } else {
          login(username); // Call the login function from AuthContext to update UI state
          navigate('/dashboard'); // Redirect to dashboard on successful login
        }
      } else {
        // Handle API errors (e.g., invalid credentials, registration errors)
        try {
          const errorData = await response.json();
          setError(errorData.message || errorData.detail || JSON.stringify(errorData));
          console.error("API Error during authentication:", errorData);
        } catch (jsonError) {
          setError(`Request failed with status: ${response.status}. Failed to parse error response.`);
          console.error("Failed to parse error response JSON:", jsonError);
          console.error("Raw response:", await response.text()); // Log raw response for debugging
        }
      }
    } catch (err) {
      // Catch network errors (e.g., server not running, CORS issues before response)
      console.error('Network or API error during login/register:', err);
      setError('An unexpected error occurred. Please check your network connection or server status.');
    }
  };

  // If already authenticated, redirect to dashboard
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