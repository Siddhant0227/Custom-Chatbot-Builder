// src/components/Login.jsx
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
  const [isRegistering, setIsRegistering] = useState(false); // State to toggle between login and register
  const navigate = useNavigate();

  // Load users from localStorage on component mount
  // No type annotation needed for useState in JSX
  const [users, setUsers] = useState(() => {
    try {
      const storedUsers = localStorage.getItem('users');
      return storedUsers ? JSON.parse(storedUsers) : [];
    } catch (e) {
      console.error("Failed to parse users from localStorage:", e);
      return [];
    }
  });

  // Save users to localStorage whenever the users state changes
  useEffect(() => {
    try {
      localStorage.setItem('users', JSON.stringify(users));
    } catch (e) {
      console.error("Failed to save users to localStorage:", e);
    }
  }, [users]);

  // Removed type annotation for 'e' in handleSubmit
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    if (isRegistering) {
      // Registration logic
      const userExists = users.some(user => user.username === username);
      if (userExists) {
        setError('Username already exists. Please choose a different one.');
      } else {
        // In a real app, hash the password before storing
        // Removed explicit type for newUser
        const newUser = { username, passwordHash: password }; // Using plain password for simplicity
        setUsers(prevUsers => [...prevUsers, newUser]);
        setSuccessMessage('Registration successful! You can now log in.');
        setIsRegistering(false); // Switch to login mode after successful registration
        setUsername(''); // Clear form fields
        setPassword('');
      }
    } else {
      // Login logic
      const foundUser = users.find(
        user => user.username === username && user.passwordHash === password
      );

      if (foundUser) {
        login(); // Mark as authenticated
        navigate('/dashboard'); // Redirect to dashboard
      } else {
        setError('Invalid username or password.');
      }
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
                <button onClick={() => setIsRegistering(false)}>Login</button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button onClick={() => setIsRegistering(true)}>Register</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;