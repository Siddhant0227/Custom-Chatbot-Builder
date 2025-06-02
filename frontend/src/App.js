// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.tsx';
import Login from './components/Login.jsx';
import DashboardPage from './components/DashboardPage.tsx';
import ChatbotBuilder from './components/ChatbotBuilder.tsx';
import WelcomeScreen from './components/WelcomeScreen.tsx';

// Define the TopNavBar component within App.jsx or in a separate file (e.g., components/TopNavBar.jsx)
const TopNavBar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate(); // Make sure useNavigate is imported from react-router-dom

  return (
    <nav className="top-nav-bar">
      <div className="nav-logo">
        {/* Changed to h1 for main title, keeping it clickable to dashboard */}
        <h1 onClick={() => navigate('/dashboard')}>Your Company Name</h1>
      </div>
      <div className="nav-links">
        {/* You can add other nav links here if needed */}
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
  const { isAuthenticated, login } = useAuth(); // logout is now handled by TopNavBar
  const location = useLocation();

  // Paths where the header should NOT be shown
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
        <Route path="/login" element={<Login onLogin={login} />} />
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