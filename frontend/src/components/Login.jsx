import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Get users from localStorage or empty array
  const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];

  // Save users back to localStorage
  const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = getUsers();

    if (isRegistering) {
      const userExists = users.some(user => user.username === username);
      if (userExists) {
        setMessage('Username already exists!');
        return;
      }
      users.push({ username, password });
      saveUsers(users);
      setMessage('Registered successfully! You can now sign in.');
      setIsRegistering(false);
    } else {
      const validUser = users.find(user => user.username === username && user.password === password);
      if (validUser) {
        setMessage('');
        onLogin(); // Call parent function to proceed
      } else {
        setMessage('Invalid username or password');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        {message && <div className="error">{message}</div>}
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
          <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
        </form>
        <p style={{ marginTop: '10px', textAlign: 'center' }}>
          {isRegistering ? (
            <>
              Already have an account?{' '}
              <span
                style={{ color: '#5a67d8', cursor: 'pointer' }}
                onClick={() => {
                  setIsRegistering(false);
                  setMessage('');
                }}
              >
                Sign In
              </span>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <span
                style={{ color: '#5a67d8', cursor: 'pointer' }}
                onClick={() => {
                  setIsRegistering(true);
                  setMessage('');
                }}
              >
                Register
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
