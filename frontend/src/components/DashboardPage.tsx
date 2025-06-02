// src/components/DashboardPage.tsx
import React, { useState, useEffect } from 'react'; // Import React for React.FC
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css'; // Ensure this points to your CSS file

// Define the Chatbot interface for type safety
interface Chatbot {
  id: string;
  name: string;
  lastUpdated: string;
}

const DashboardPage: React.FC = () => {
  // Use type annotations for useState
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Explicitly boolean
  const navigate = useNavigate();

  useEffect(() => {
    // Define the mock data with the Chatbot type
    const mockData: Chatbot[] = [
      { id: 'mock-1', name: 'HR Assistant Bot', lastUpdated: '2025-05-30' },
      { id: 'mock-2', name: 'Customer Support Bot', lastUpdated: '2025-05-28' },
      { id: 'mock-3', name: 'Sales Assistant Bot', lastUpdated: '2025-05-25' },
      { id: 'mock-4', name: 'Technical Support Bot', lastUpdated: '2025-05-20' },
    ];

    const timer = setTimeout(() => {
      setChatbots(mockData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleCreateNew = () => {
    navigate('/welcome');
  };

  // Add type annotation for the 'id' parameter
  const handleEditChatbot = (id: string) => {
    navigate(`/build/${id}`);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Your Chatbots</h1>
        <button onClick={handleCreateNew} className="btn-create-chatbot">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12h8"/>
              <path d="M12 8v8"/>
          </svg>
          Create New Chatbot
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader animate-spin">
            <line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/><line x1="4.93" x2="7.76" y1="4.93" y2="7.76"/><line x1="16.24" x2="19.07" y1="16.24" y2="19.07"/><line x1="2" x2="6" y1="12" y2="12"/><line x1="18" x2="22" y1="12" y2="12"/><line x1="4.93" x2="7.76" y1="19.07" y2="16.24"/><line x1="16.24" x2="19.07" y1="7.76" y2="4.93"/>
          </svg>
          <p>Loading chatbots...</p>
        </div>
      ) : chatbots.length === 0 ? (
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-inbox-zero empty-icon">
              <path d="M22 12h-4l-3 9L7 3l-3 9H2"/>
              <path d="M5.45 12.91 2 22h20l-3.45-9.09C18.56 11.72 19 11.19 19 10.5c0-.9-.7-1.5-1.5-1.5h-11C5.7 9 5 9.6 5 10.5c0 .69.44 1.22.95 1.41z"/>
          </svg>
          <h3>No Chatbots Yet!</h3>
          <p>It looks like you haven't created any chatbots. Start building your first one now!</p>
          <button onClick={handleCreateNew} className="btn-create-empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12h8"/>
              <path d="M12 8v8"/>
            </svg>
            Create Your First Chatbot
          </button>
        </div>
      ) : (
        <div className="chatbot-grid">
          {chatbots.map((chatbot: Chatbot) => ( // Explicitly type chatbot in map
            <div key={chatbot.id} className="chatbot-card">
              <div className="card-header">
                <div className="chatbot-info">
                  <h3>{chatbot.name}</h3>
                  <span className="status-badge status-active">Active</span>
                </div>
                <div className="card-actions">
                  <button onClick={() => handleEditChatbot(chatbot.id)} className="btn-edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
                    </svg>
                  </button>
                  <button className="btn-settings">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.75 1.3a2 2 0 0 0 .73 2.73l.04.04a2 2 0 0 1 0 2.83l-.04.04a2 2 0 0 0-.73 2.73l.75 1.3a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.75-1.3a2 2 0 0 0-.73-2.73l-.04-.04a2 2 0 0 1 0-2.83l.04-.04a2 2 0 0 0 .73-2.73l-.75-1.3a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="card-category">
                <span className="category-tag">Customer Service</span>
              </div>
              <div className="card-stats">
                <div className="stat-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>1,200 Interactions</span>
                </div>
                <div className="stat-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>25 Active Users</span>
                </div>
              </div>
              <div className="card-footer">
                <p className="last-updated">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-check">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/>
                  </svg>
                  Last Updated: {chatbot.lastUpdated}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;