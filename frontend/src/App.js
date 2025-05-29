// src/App.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatbotBuilder from './components/ChatbotBuilder.tsx';
import CustomChatbot from './components/CustomChatbot.js';
import WelcomeScreen from './components/WelcomeScreen.tsx'; // Import the new component
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Define API base URL for your Django backend
// IMPORTANT: Replace this with your actual backend URL (e.g., 'https://your-backend.com/api')
const API_BASE_URL = 'http://localhost:8000/api';

function App() {
    // State for the chatbot configuration (nodes, edges, etc.)
    const [chatbotConfig, setChatbotConfig] = useState(null);
    // State to toggle between builder and demo mode, and welcome screen
    const [showBuilder, setShowBuilder] = useState(false); // Start with builder hidden
    const [showWelcomeScreen, setShowWelcomeScreen] = useState(true); // New state for welcome screen

    // State for managing chatbot name, ID, and saved list
    const [chatbotName, setChatbotName] = useState('New Chatbot');
    const [currentChatbotId, setCurrentChatbotId] = useState(null); // Stores the ID of the currently loaded/saved chatbot
    const [userChatbots, setUserChatbots] = useState([]); // List of chatbots saved by the user

    // State for UI feedback (loading, messages, errors)
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

    // Ref to access ChatbotBuilder's internal methods (like getting current flow config)
    const chatbotBuilderRef = useRef(null);

    // --- Authentication Helper ---
    // This function should return your authentication token (e.g., JWT).
    // Replace with your actual token retrieval logic (e.g., from localStorage, context, etc.)
    const getAuthToken = useCallback(() => {
        // Example: Get JWT token from localStorage
        // In a real app, you'd have a proper login flow and token management.
        return localStorage.getItem('accessToken');
    }, []);

    // Helper to construct authorization headers for API calls
    const getAuthHeaders = useCallback(() => {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`; // For JWT authentication
        }
        return headers;
    }, [getAuthToken]);

    // --- Save Chatbot Function ---
    const saveChatbot = async () => {
        setLoading(true);
        setError(null);
        setMessage('');

        // Get the current configuration from the ChatbotBuilder component using the ref
        if (!chatbotBuilderRef.current || typeof chatbotBuilderRef.current.getCurrentFlowConfig !== 'function') {
            setError("ChatbotBuilder not ready or missing getCurrentFlowConfig method.");
            setMessage("Error: Cannot get current chatbot configuration for saving.");
            setLoading(false);
            return;
        }
        const configToSave = chatbotBuilderRef.current.getCurrentFlowConfig();

        try {
            const payload = {
                name: chatbotName,
                config: configToSave, // This should contain nodes, edges, and any other builder-specific data
            };

            let method = 'POST';
            let url = `${API_BASE_URL}/chatbots/`;

            // If we have a currentChatbotId, it means we are updating an existing chatbot
            // The Django backend's custom `create` method in ViewSet handles this logic
            if (currentChatbotId) {
                payload.id = currentChatbotId; // Include ID for update/upsert
            }

            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Attempt to get a more specific error message from DRF response
                const errorMessage = errorData.detail || (errorData.name && errorData.name[0]) || JSON.stringify(errorData) || 'Failed to save chatbot.';
                throw new Error(errorMessage);
            }

            const savedChatbot = await response.json();
            setCurrentChatbotId(savedChatbot.id); // Update ID if it was a new save
            setChatbotName(savedChatbot.name); // Ensure name is updated if backend changed it (e.g., uniqueness)
            setMessage(`Chatbot "${savedChatbot.name}" saved successfully!`);

            // After saving, refresh the list of user's chatbots
            fetchUserChatbots();

        } catch (err) {
            setError(err.message);
            setMessage('Error saving chatbot.');
            console.error('Save Chatbot Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- Fetch User Chatbots Function (for "Load Old Map") ---
    const fetchUserChatbots = useCallback(async () => {
        setLoading(true);
        setError(null);
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/chatbots/`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication required. Please log in.');
                }
                const errorData = await response.json();
                const errorMessage = errorData.detail || JSON.stringify(errorData) || 'Failed to fetch chatbots.';
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setUserChatbots(data); // Store the list of chatbots

        } catch (err) {
            setError(err.message);
            setMessage('Error fetching chatbots.');
            console.error('Fetch Chatbots Error:', err);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    // --- Load Selected Chatbot Function ---
    const loadChatbot = useCallback(async (chatbotId) => {
        setLoading(true);
        setError(null);
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/chatbots/${chatbotId}/`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || JSON.stringify(errorData) || 'Failed to load chatbot.';
                throw new Error(errorMessage);
            }

            const loadedChatbot = await response.json();

            // Set the loaded configuration to be passed to ChatbotBuilder
            setChatbotConfig(loadedChatbot.config);
            setChatbotName(loadedChatbot.name);
            setCurrentChatbotId(loadedChatbot.id);
            setShowWelcomeScreen(false); // Hide welcome screen
            setShowBuilder(true); // Ensure we are in builder mode to see the loaded config
            setMessage(`Chatbot "${loadedChatbot.name}" loaded successfully!`);

        } catch (err) {
            setError(err.message);
            setMessage('Error loading chatbot.');
            console.error('Load Chatbot Error:', err);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    // --- Start New Chatbot Function ---
    const startNewChatbot = () => {
        setChatbotConfig(null); // Clear existing config
        setChatbotName('New Chatbot');
        setCurrentChatbotId(null);
        setShowWelcomeScreen(false); // Hide welcome screen
        setShowBuilder(true); // Ensure we are in builder mode
        setMessage('Starting a new chatbot. Design your flow!');
        setError(null);
    };

    // Handle starting building from WelcomeScreen
    const handleStartBuildingFromWelcome = () => {
        startNewChatbot(); // Call startNewChatbot to initialize a fresh builder experience
    };

    // Fetch chatbots when the component mounts or auth headers change
    useEffect(() => {
        fetchUserChatbots();
    }, [fetchUserChatbots]);


    return (
        <div className="App">
            {showWelcomeScreen ? (
                <WelcomeScreen
                    onStartBuilding={handleStartBuildingFromWelcome}
                    userChatbots={userChatbots} // Pass user chatbots to welcome screen
                    onLoadChatbot={loadChatbot} // Pass load chatbot function
                    loading={loading}
                    error={error}
                    message={message}
                />
            ) : showBuilder ? (
                <>
                    <div className="p-3 bg-dark text-white">
                        <div className="container d-flex justify-content-between align-items-center">
                            <h1 className="h4 fw-bold">Chatbot Builder Platform</h1>
                            <div className="d-flex align-items-center gap-3">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    style={{ width: '200px' }}
                                    value={chatbotName}
                                    onChange={(e) => setChatbotName(e.target.value)}
                                    placeholder="Chatbot Name"
                                    disabled={loading}
                                />
                                <button
                                    onClick={saveChatbot} // Call saveChatbot directly
                                    className="btn btn-success"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : (currentChatbotId ? 'Update Chatbot' : 'Save New Chatbot')}
                                </button>
                                <button
                                    onClick={startNewChatbot}
                                    className="btn btn-info"
                                    disabled={loading}
                                >
                                    New Chatbot
                                </button>
                                <button
                                    onClick={() => {
                                        // When switching to demo, get the current config from builder
                                        if (chatbotBuilderRef.current && typeof chatbotBuilderRef.current.getCurrentFlowConfig === 'function') {
                                            setChatbotConfig(chatbotBuilderRef.current.getCurrentFlowConfig());
                                            setShowBuilder(false);
                                            setMessage('Switched to demo mode. Your current builder state is ready for demo.');
                                            setError(null);
                                        } else {
                                            setError("ChatbotBuilder not ready or missing getCurrentFlowConfig method for demo.");
                                            setMessage("Error: Cannot switch to demo mode without current builder configuration.");
                                        }
                                    }}
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    View Demo
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="container py-3">
                        {message && (
                            <div className={`alert ${error ? 'alert-danger' : 'alert-success'} mt-3`} role="alert">
                                {message}
                            </div>
                        )}
                    </div>
                    <ChatbotBuilder
                        initialConfig={chatbotConfig} // Pass loaded config to builder
                        ref={chatbotBuilderRef} // Attach ref to ChatbotBuilder
                    />
                    {/* The "Your Saved Chatbots" section is now primarily on the WelcomeScreen
                        but can be kept here if you want it duplicated or accessible in builder mode too.
                        I've removed it from here for now to avoid redundancy, assuming WelcomeScreen is the main entry point for loading.
                        If you want it here, you can re-add it. */}
                </>
            ) : (
                <>
                    <div className="p-3 bg-dark text-white">
                        <div className="container d-flex justify-content-between align-items-center">
                            <h1 className="h4 fw-bold">Chatbot Demo Mode</h1>
                            <button
                                onClick={() => setShowBuilder(true)}
                                className="btn btn-primary"
                            >
                                Back to Builder
                            </button>
                        </div>
                    </div>
                    <div className="container py-4">
                        <div className="bg-white shadow-sm border rounded-3 p-4 mb-4">
                            <h2 className="h5 fw-semibold mb-3">Chatbot Demo</h2>
                            <p className="mb-2">
                                You are now previewing the chatbot "<strong>{chatbotConfig?.name || 'Unnamed Chatbot'}</strong>". Look for the chat bubble in the bottom right corner.
                            </p>
                            <p>
                                Try sending some messages to see how your configured rules work.
                            </p>
                        </div>
                    </div>
                    {chatbotConfig ? (
                        <CustomChatbot config={chatbotConfig} />
                    ) : (
                        <div className="container py-4 text-center">
                            <p className="text-muted">No chatbot configuration available for demo. Please build or load one first.</p>
                            <button
                                onClick={() => setShowWelcomeScreen(true)}
                                className="btn btn-outline-secondary mt-3"
                            >
                                Go to Welcome Screen
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default App;