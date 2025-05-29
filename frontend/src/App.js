// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import ChatbotBuilder from './components/ChatbotBuilder.tsx';
import CustomChatbot from './components/CustomChatbot.js';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Define API base URL for your Django backend
// IMPORTANT: Replace this with your actual backend URL (e.g., '[https://your-backend.com/api](https://your-backend.com/api)')
const API_BASE_URL = 'http://localhost:8000/api';

function App() {
    // State for the chatbot configuration (nodes, edges, etc.)
    const [chatbotConfig, setChatbotConfig] = useState(null);
    // State to toggle between builder and demo mode
    const [showBuilder, setShowBuilder] = useState(true);

    // State for managing chatbot name, ID, and saved list
    const [chatbotName, setChatbotName] = useState('New Chatbot');
    const [currentChatbotId, setCurrentChatbotId] = useState(null); // Stores the ID of the currently loaded/saved chatbot
    const [userChatbots, setUserChatbots] = useState([]); // List of chatbots saved by the user

    // State for UI feedback (loading, messages, errors)
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

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
    const saveChatbot = async (configToSave) => {
        setLoading(true);
        setError(null);
        setMessage('');

        try {
            // The configToSave comes from ChatbotBuilder's onExport or current state
            const payload = {
                name: chatbotName,
                config: configToSave, // This should contain nodes, edges, and any other builder-specific data
            };

            let method = 'POST';
            let url = `${API_BASE_URL}/chatbots/`;

            // If we have a currentChatbotId, it means we are updating an existing chatbot
            // The Django backend's custom `create` method in ViewSet handles this logic
            if (currentChatbotId) {
                payload.id = currentChatbotId;
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
    }, [getAuthHeaders]); // Re-create if getAuthHeaders changes (unlikely if static)

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
        setShowBuilder(true); // Ensure we are in builder mode
        setMessage('Starting a new chatbot. Design your flow!');
        setError(null);
    };

    // Fetch chatbots when the component mounts
    useEffect(() => {
        fetchUserChatbots();
    }, [fetchUserChatbots]);


    return (
        <div className="App">
            {showBuilder ? (
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
                                {/* The onExport from ChatbotBuilder is for switching to demo mode.
                                    The save button here triggers the actual save to backend. */}
                                <button
                                    onClick={() => {
                                        // When saving, we need the current config from ChatbotBuilder.
                                        // This assumes ChatbotBuilder has a way to expose its current state,
                                        // or you might lift its state (nodes, edges) to App.js directly.
                                        // For now, let's assume ChatbotBuilder's onExport provides the full config.
                                        // If ChatbotBuilder doesn't provide a way to get current config for save,
                                        // you might need to add a ref or another prop to get it.
                                        // For this example, we'll assume ChatbotBuilder's internal state
                                        // can be accessed or passed up specifically for saving.
                                        // A more robust solution might involve lifting nodes/edges state to App.js
                                        // or adding a `getCurrentConfig` prop to ChatbotBuilder.
                                        // For now, we'll use a placeholder or assume `chatbotConfig` is up-to-date
                                        // before calling save.
                                        // A better approach: `ChatbotBuilder` should expose a ref or a callback
                                        // to get its current `nodes` and `edges` for the `saveChatbot` function.
                                        // For demonstration, let's assume `chatbotConfig` holds the latest exported config
                                        // or we'll need to pass a function to ChatbotBuilder to get its internal state.
                                        // Let's modify the `onExport` to also be used for saving.
                                        // No, `onExport` is for demo. We need a way to get builder's current state.
                                        // A common pattern is to have a `save` button *inside* the builder
                                        // or pass a function from `App.js` to `ChatbotBuilder` that triggers save.
                                        // For simplicity, let's assume `ChatbotBuilder` will expose its current state
                                        // through a ref or a dedicated prop.
                                        // For now, let's make `saveChatbot` take the config as an argument,
                                        // and we'll need to pass a way for `App.js` to get the current config from `ChatbotBuilder`.
                                        // This is a common challenge with state management between parent/child.
                                        // Let's assume `ChatbotBuilder` will have an internal ref to its flow instance
                                        // and we can call a method on it. Or, `ChatbotBuilder`'s `onExport` can be
                                        // dual-purpose, or we add another callback.

                                        // For now, let's make `saveChatbot` use a temporary mechanism to get config.
                                        // A more robust solution would be to lift nodes/edges state to App.js
                                        // or pass a function to ChatbotBuilder that gets its internal state.
                                        // Given the current `onExport` structure, it's best if `ChatbotBuilder`
                                        // provides a `getCurrentConfig` method.
                                        // For this example, I'll assume `ChatbotBuilder` will be updated to
                                        // accept a `onSave` prop which it calls with its current config.
                                        // Or, we can use a ref. Let's use a ref for `ChatbotBuilder` to get its current state.
                                        if (window.chatbotBuilderRef && window.chatbotBuilderRef.current && typeof window.chatbotBuilderRef.current.getCurrentFlowConfig === 'function') {
                                            const currentFlowConfig = window.chatbotBuilderRef.current.getCurrentFlowConfig();
                                            saveChatbot(currentFlowConfig);
                                        } else {
                                            setError("ChatbotBuilder not ready or missing getCurrentFlowConfig method.");
                                            setMessage("Error: Cannot get current chatbot configuration for saving.");
                                        }
                                    }}
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
                        onExport={(config) => {
                            setChatbotConfig(config);
                            setShowBuilder(false);
                            setMessage('Switched to demo mode. Your current builder state is ready for demo.');
                            setError(null);
                        }}
                        // This ref will allow App.js to call methods on ChatbotBuilder
                        ref={(instance) => { window.chatbotBuilderRef = { current: instance }; }}
                    />
                    <div className="container py-4">
                        <div className="bg-white shadow-sm border rounded-3 p-4 mb-4">
                            <h2 className="h5 fw-semibold mb-3">Your Saved Chatbots</h2>
                            {loading && <p>Loading saved chatbots...</p>}
                            {userChatbots.length === 0 && !loading && <p>No saved chatbots found.</p>}
                            <ul className="list-group">
                                {userChatbots.map((cb) => (
                                    <li key={cb.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{cb.name}</strong>
                                            <br />
                                            <small className="text-muted">Last Updated: {new Date(cb.updated_at).toLocaleString()}</small>
                                        </div>
                                        <button
                                            onClick={() => loadChatbot(cb.id)}
                                            className="btn btn-sm btn-outline-primary"
                                            disabled={loading || currentChatbotId === cb.id} // Disable if already loaded or loading
                                        >
                                            {currentChatbotId === cb.id ? 'Loaded' : 'Load'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
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
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default App;