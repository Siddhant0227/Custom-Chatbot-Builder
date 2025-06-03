// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.tsx';
import './Login.css'

// Helper function to get CSRF token from cookies
const getCookie = (name) => { // Removed type annotation for 'name'
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

  const handleSubmit = async (e) => { // Removed type annotation for 'e'
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      let response;
      let data;
      const apiUrl = isRegistering ? '/api/register/' : '/api/login/';

      // Get CSRF token
      const csrftoken = getCookie('csrftoken');

      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken || '', // Include CSRF token in header
        },
        body: JSON.stringify({ username, password }),
      });

      // Check if the response is OK (status 2xx)
      if (response.ok) {
        data = await response.json(); // Parse JSON only if response is OK
        if (isRegistering) {
          setSuccessMessage('Registration successful! You can now log in.');
          setIsRegistering(false); // Switch to login mode after successful registration
          setUsername(''); // Clear form fields
          setPassword('');
        } else {
          // On successful login, call the login function from AuthContext
          // Pass the username so AuthContext can store it.
          login(username);
          navigate('/dashboard'); // Redirect to dashboard
        }
      } else {
        // If response is not OK, try to parse error message from JSON
        // Django REST Framework often returns errors in 'detail' or 'message' fields,
        // or as an object with field-specific errors.
        try {
          data = await response.json();
          setError(data.message || data.detail || JSON.stringify(data));
        } catch (jsonError) {
          // Fallback if the response is not valid JSON (e.g., HTML redirect page)
          setError(`Request failed with status: ${response.status}. Please check server logs.`);
          console.error("Failed to parse error response JSON:", jsonError);
          console.error("Raw response:", await response.text()); // Log raw response for debugging
        }
      }
    } catch (error) {
      // Catch network errors (e.g., server not running, CORS issues)
      console.error('Network or API error:', error);
      setError('An unexpected error occurred. Please check your network connection or server status.');
    }
  };

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {/* The CSS is assumed to be in Login.css or injected via a style tag as before */}
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
