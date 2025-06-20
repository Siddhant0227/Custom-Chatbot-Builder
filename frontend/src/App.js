// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.tsx'; 
import LoginPage from './components/LoginPage.jsx';

import DashboardPage from './components/DashboardPage.tsx';
import ChatbotBuilder from './components/ChatbotBuilder.tsx';
import WelcomeScreen from './components/WelcomeScreen.tsx';


const TopNavBar = () => {
  const { logout, username } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="top-nav-bar">
      <div className="nav-logo">

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
  const { isAuthenticated } = useAuth(); 
  const location = useLocation();

  
  const hideHeaderRoutes = [
    '/build/', // When building a chatbot
    '/login',   // Login page
    '/welcome'  // Welcome screen (if it's a first-time setup or a different flow)
  ];

  const shouldHideHeader = hideHeaderRoutes.some(path => location.pathname.startsWith(path));

  return (
    <div className="App">
      {isAuthenticated && !shouldHideHeader && <TopNavBar />}

      <Routes>
       
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/welcome" element={<PrivateRoute><WelcomeScreen /></PrivateRoute>} />
        <Route path="/build/:chatbotId?" element={<PrivateRoute><ChatbotBuilder /></PrivateRoute>} />
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
