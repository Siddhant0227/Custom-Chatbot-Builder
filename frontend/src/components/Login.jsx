
import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.tsx';
import './Login.css'

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  // --- IMPORTANT: Removed the 'users' state and its useEffect for localStorage persistence. ---
  // --- This logic is now handled by your Django backend. ---

  const handleSubmit = async (e) => { // Make handleSubmit async
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
      // Determine the API endpoint based on whether the user is registering or logging in
      const apiUrl = isRegistering ? '/api/register/' : '/api/login/';

      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // If you need to send a CSRF token for Django (e.g., if not using token auth
          // and Django's default session auth requires it for non-GET requests),
          // you would fetch it from a cookie and include it here.
          // Example: 'X-CSRFToken': getCookie('csrftoken'),
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
