// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.tsx'; // Assuming AuthContext.tsx provides 'username'
import Login from './components/Login.jsx';
import DashboardPage from './components/DashboardPage.tsx';
import ChatbotBuilder from './components/ChatbotBuilder.tsx';
import WelcomeScreen from './components/WelcomeScreen.tsx';

// Define the TopNavBar component
const TopNavBar = () => {
  // Assuming useAuth now provides a 'username' property
  const { logout, username } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="top-nav-bar">
      <div className="nav-logo">
        {/* Display the username if available, otherwise a generic welcome */}
        <h1 onClick={() => navigate('/dashboard')}>
          {username ? `Welcome, ${username}` : 'Your Dashboard'}
        </h1>
      </div>
      <div className="nav-links">
        <button onClick={logout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth(); // No need for 'login' here directly
  const location = useLocation();

  
  const hideHeaderRoutes = [
    '/build/', // When building a chatbot
    '/login',   // Login page
    '/welcome'  // Welcome screen (if it's a first-time setup or a different flow)
  ];

  // Check if current path starts with any of the hideHeaderRoutes
  const shouldHideHeader = hideHeaderRoutes.some(path => location.pathname.startsWith(path));

  return (
    <div className="App">
      {/* Conditionally render the TopNavBar */}
      {isAuthenticated && !shouldHideHeader && <TopNavBar />}

      <Routes>
        {/* Pass the login function to Login component if it needs to trigger authentication */}
        {/* Note: If Login component directly uses useAuth().login(), you don't need to pass it as a prop */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/welcome" element={<PrivateRoute><WelcomeScreen /></PrivateRoute>} />
        <Route path="/build/:chatbotId?" element={<PrivateRoute><ChatbotBuilder /></PrivateRoute>} />
        {/* Default route for authenticated users, redirects to dashboard */}
        <Route
          path="*"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
