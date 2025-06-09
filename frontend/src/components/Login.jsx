// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.tsx'; // Assuming AuthContext provides login/isAuthenticated
import './Login.css'; // Your CSS for styling

// Define your API base URL for consistency
const API_BASE_URL = 'http://127.0.0.1:8000';

const Login = () => {
  // Destructure authentication state and functions from your AuthContext
  const { isAuthenticated, login } = useAuth();

  // State variables for form inputs, errors, success messages, and mode (login/register)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Controls between login and register mode

  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Handle form submission for both login and registration
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    setError(''); // Clear any previous errors
    setSuccessMessage(''); // Clear any previous success messages

    // Basic client-side validation
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      // Determine the API endpoint based on whether the user is registering or logging in
      const apiUrl = isRegistering ? `${API_BASE_URL}/api/register/` : `${API_BASE_URL}/api/login/`;

      // Make the API call to your Django backend
      const response = await fetch(apiUrl, {
        method: 'POST', // Always POST for login/register
        headers: {
          'Content-Type': 'application/json', // Specify JSON content type
          // IMPORTANT: The 'Authorization' header is NOT sent here.
          // Login/Register endpoints are public and return a token, they don't consume one.
        },
        body: JSON.stringify({ username, password }), // Send username and password as JSON
      });

      // Check if the response was successful (status code 2xx)
      if (response.ok) {
        const data = await response.json(); // Parse the JSON response

        if (isRegistering) {
          // Handle successful registration
          setSuccessMessage('Registration successful! You can now log in.');
          setIsRegistering(false); // Switch back to login mode
          setUsername(''); // Clear form fields
          setPassword(''); // Clear form fields
          // Optionally, if the backend returns a token on registration, log in directly
          if (data.token) {
            login(data.username, data.token); // Use AuthContext to log in and store token
            navigate('/dashboard'); // Redirect to dashboard
          }
        } else {
          // Handle successful login
          if (data.token) { // Ensure a token was received
            login(data.username, data.token); // Use AuthContext to log in and store token
            navigate('/dashboard'); // Redirect to dashboard
          } else {
            // If login was "successful" but no token, something is wrong
            setError('Login successful, but no authentication token received. Please try again.');
            console.error('Login successful, but no token received:', data);
          }
        }
      } else {
        // Handle API errors (e.g., 400 Bad Request, 401 Unauthorized for invalid credentials)
        try {
          const errorData = await response.json(); // Try to parse error details from JSON
          setError(errorData.message || errorData.detail || 'An unknown error occurred during authentication.');
          console.error("API Error during authentication:", errorData);
        } catch (jsonError) {
          // Fallback if the error response is not valid JSON
          setError(`Request failed with status: ${response.status}. Could not parse error details.`);
          console.error("Failed to parse error response JSON:", jsonError);
          console.error("Raw response:", await response.text()); // Log raw response for debugging
        }
      }
    } catch (err) {
      // Handle network errors (e.g., server unreachable, CORS issues)
      console.error('Network or API error during login/register:', err);
      setError('Could not connect to the server. Please check your network connection or server status.');
    }
  };

  // If the user is already authenticated, redirect them to the dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="login-container">
        <div className="login-card">
          <h2>{isRegistering ? 'Register' : 'Login'}</h2>
          {/* Display error or success messages */}
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

          {/* Toggle between Login and Register modes */}
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