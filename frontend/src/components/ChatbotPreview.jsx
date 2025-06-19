import React, { useState, useEffect, useRef } from 'react';
import './ChatbotPreview.css';
import ReactDOM from 'react-dom/client';

/**
 * @param {Object} props
 * @param {string} props.botName
 * @param {string} props.welcomeMessage
 * @param {string} props.fallbackMessage
 * @param {Array<Object>} props.nodes
 * @param {Array<Object>} props.connections
 * @param {boolean} [props.isPreview=false] // Add this new prop
 */
function ChatbotPreview({ botName, welcomeMessage, fallbackMessage, nodes, connections, isPreview = false }) {
  const [isChatOpen, setIsChatOpen] = useState(isPreview); // Initialize with isPreview
  const [chatStarted, setChatStarted] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');
  const [aiCorrectionSuggestion, setAiCorrectionSuggestion] = useState(null); // New state for AI correction suggestion
  const chatboxRef = useRef(null); // Ref for the chatbox to scroll to bottom

  // Pulse animation for chat toggle button
  useEffect(() => {
    const chatIcon = document.getElementById("chatToggleBtn");
    if (chatIcon) {
      const interval = setInterval(() => {
        chatIcon.classList.toggle('pulse-animation');
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  // Scroll to bottom of chatbox when conversation updates
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [conversation, showRating]);

  // Open/Close chat container handlers
  const openChatContainer = () => {
    setIsChatOpen(true);
    if (!chatStarted) {
      startConversationHandler();
    }
  };

  const closeChatContainer = () => {
    setIsChatOpen(false);
    setChatStarted(false);
    setConversation([]);
    setCurrentNodeId(null);
    setShowRating(false);
    setRatingSubmitted(false);
    setSelectedRating(0);
    setRatingMessage('');
    setAiCorrectionSuggestion(null);
  };

  // Start the conversation flow
  const startConversationHandler = () => {
    setChatStarted(true);
    const startNode = nodes.find(node => node.id === 'start-1');

    if (startNode) {
      setCurrentNodeId(startNode.id);
      processNode(startNode);
    } else {
      addBotMessage(welcomeMessage || 'Hello! How can I help you with our ERP system today?');
    }
  };

  // Add a message to the conversation state
  const addMessageToConversation = (sender, message, isTyping = false, options = [], inputRequired = false, isCorrection = false) => {
    setConversation((prevConv) => [
      ...prevConv,
      { sender, message, isTyping, options, inputRequired, isCorrection },
    ]);
  };

  // Process different types of chatbot nodes
  const processNode = (node, userInputValue = '') => {
    let messageContent = node.data?.content || '';
    let options = [];
    let inputRequired = false;

    // Replace placeholder with user input if available
    messageContent = messageContent.replace('{{userInput}}', userInputValue);

    switch (node.type) {
      case 'start':
      case 'message':
        addBotMessage(messageContent);
        // Find next node based on connection
        const nextMessageConnection = connections.find(conn => conn.sourceId === node.id);
        if (nextMessageConnection) {
          const nextNode = nodes.find(n => n.id === nextMessageConnection.targetId);
          if (nextNode) {
            setCurrentNodeId(nextNode.id);
            setTimeout(() => processNode(nextNode), 500); // Simulate bot typing/thinking time
          }
        }
        break;
      case 'multichoice':
      case 'button':
        options = node.data?.options || [];
        addBotMessage(messageContent, false, options);
        break;
      case 'textinput':
        inputRequired = true;
        addBotMessage(messageContent, false, [], inputRequired);
        break;
      case 'rating':
        setShowRating(true);
        setRatingMessage(messageContent);
        break;
      case 'end':
        addMessageToConversation(
          'bot',
          messageContent + ' Would you like to start over?',
          false,
          [{ label: 'Restart', value: 'restart' }],
          false
        );
        break;
      default:
        addBotMessage(`Unhandled node type: ${node.type}. Content: ${messageContent}`);
    }
  };

  // Handle user's message input
  const processUserMessage = async (message) => {
    if (message.toLowerCase() === 'restart') {
      closeChatContainer();
      openChatContainer();
      return;
    }

    if (!message.trim()) return;

    addMessageToConversation('user', message);
    setUserMessage('');
    setAiCorrectionSuggestion(null); // Clear any previous suggestion

    // Simulate AI correction process
    const correctedMessage = await correctUserInputWithAI(message);

    if (correctedMessage.toLowerCase() !== message.toLowerCase()) {
      // Display correction suggestion
      setAiCorrectionSuggestion({ original: message, corrected: correctedMessage });
    } else {
      // If no correction, proceed as normal
      await handleProcessedMessage(correctedMessage);
    }
  };

  // Function to handle the corrected/final message
  const handleProcessedMessage = async (finalMessage) => {
    // Add "Delivered" status if it wasn't a direct correction acceptance
    const lastMessage = conversation[conversation.length - 1];
    if (lastMessage && lastMessage.sender === 'user' && !lastMessage.isCorrection) {
      addMessageToConversation('status', 'Delivered');
    }

    addMessageToConversation('bot', '', true); // Show typing indicator

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate bot thinking

    // Remove typing indicator and add bot's actual message
    setConversation((prevConv) =>
      prevConv.filter((msg) => !(msg.sender === 'bot' && msg.isTyping))
    );

    let nextNode = null;
    let aiResponseUsed = false;

    if (currentNodeId) {
      const currentNode = nodes.find(node => node.id === currentNodeId);

      if (currentNode) {
        if (currentNode.data?.useAI) {
          const ai_raw_response = await getAIResponse(finalMessage);
          addBotMessage(ai_raw_response);
          aiResponseUsed = true;

          const singleConnection = connections.find(conn => conn.sourceId === currentNode.id);
          if (singleConnection) {
            nextNode = nodes.find(node => node.id === singleConnection.targetId);
          }
        } else {
          if (currentNode.type === 'multichoice' || currentNode.type === 'button') {
            const matchingConnection = connections.find(conn =>
              conn.sourceId === currentNode.id && conn.sourceOutput === finalMessage
            );
            if (matchingConnection) {
              nextNode = nodes.find(node => node.id === matchingConnection.targetId);
            }
          } else if (currentNode.type === 'textinput' || currentNode.type === 'message') {
            const singleConnection = connections.find(conn => conn.sourceId === currentNode.id);
            if (singleConnection) {
              nextNode = nodes.find(node => node.id === singleConnection.targetId);
            }
          }
        }
      }
    }
    if (nextNode) {
      setCurrentNodeId(nextNode.id);
      processNode(nextNode, finalMessage);
    } else if (!aiResponseUsed) {
      addMessageToConversation(
        'bot',
        fallbackMessage || "I'm sorry, I didn't understand that. Would you like to start over?",
        false,
        [{ label: 'Restart', value: 'restart' }],
        false
      );
    }
  }

  // Helper to add bot messages, potentially with typing indicator
  const addBotMessage = (message, showTyping = false, options = [], inputRequired = false) => {
    if (showTyping) {
      addMessageToConversation('bot', '', true, [], false);
      setTimeout(() => {
        setConversation((prevConv) =>
          prevConv.map((msg) =>
            msg.sender === 'bot' && msg.isTyping ? { ...msg, message: message, isTyping: false, options: options, inputRequired: inputRequired } : msg
          )
        );
      }, 1000);
    } else {
      addMessageToConversation('bot', message, false, options, inputRequired);
    }
  };

  // Handle click on predefined options
  const handleOptionClick = (optionValue) => {
    processUserMessage(optionValue);
  };

  // Handle user text input from the input field
  const handleUserTextInput = () => {
    if (userMessage.toLowerCase() === 'restart') {
      closeChatContainer();
      openChatContainer();
    } else {
      processUserMessage(userMessage);
    }
  };

  // Handle star rating click
  const handleStarClick = (rating) => {
    setSelectedRating(rating);
  };

  // Submit rating
  const submitRating = () => {
    setRatingSubmitted(true);
    // In a real app, you would send this rating to your backend
    console.log('User rated:', selectedRating, 'stars');
  };

  // Skip rating and proceed to next node
  const skipRating = () => {
    setShowRating(false);
    const ratingNode = nodes.find(node => node.id === currentNodeId);
    if (ratingNode) {
      const nextConnection = connections.find(conn => conn.sourceId === ratingNode.id);
      if (nextConnection) {
        const nextNode = nodes.find(node => node.id === nextConnection.targetId);
        if (nextNode) {
          setCurrentNodeId(nextNode.id);
          processNode(nextNode);
        }
      } else {
        // If no explicit connection after rating, just end or offer restart
        addMessageToConversation(
          'bot',
          "Thank you for your feedback! Would you like to start over?",
          false,
          [{ label: 'Restart', value: 'restart' }],
          false
        );
      }
    } else {
      // Fallback if current node is not found
      addMessageToConversation(
        'bot',
        "Thank you! Would you like to start over?",
        false,
        [{ label: 'Restart', value: 'restart' }],
        false
      );
    }
  };

  // Close rating overlay
  const closeRating = () => {
    setShowRating(false);
    setSelectedRating(0);
    setRatingSubmitted(false);
    setRatingMessage('');
    skipRating(); // Treat closing as skipping for flow control
  };

  // Handle chat again button click
  const handleChatAgain = () => {
    setShowRating(false);
    setRatingSubmitted(false);
    setSelectedRating(0);
    setRatingMessage('');
    setConversation([]);
    setCurrentNodeId(null);
    setChatStarted(false);
    setAiCorrectionSuggestion(null);
    setTimeout(() => {
      startConversationHandler();
    }, 100);
  };

  // Handle accepting AI correction
  const acceptCorrection = async () => {
    if (aiCorrectionSuggestion) {
      const originalMessage = aiCorrectionSuggestion.original;
      const corrected = aiCorrectionSuggestion.corrected;

      // Update the last user message to the corrected one
      setConversation((prevConv) =>
        prevConv.map((msg, idx) =>
          idx === prevConv.length - 1 && msg.sender === 'user'
            ? { ...msg, message: corrected, isCorrection: true } // Mark as corrected
            : msg
        )
      );

      setAiCorrectionSuggestion(null); // Clear suggestion after acceptance
      await handleProcessedMessage(corrected);
    }
  };

  // Handle declining AI correction
  const declineCorrection = async () => {
    if (aiCorrectionSuggestion) {
      const originalMessage = aiCorrectionSuggestion.original;
      setAiCorrectionSuggestion(null); // Clear suggestion
      await handleProcessedMessage(originalMessage); // Process original message
    }
  };


  return (
    <>
      {/* Chat Toggle Button */}
      <button id="chatToggleBtn" className={`pulse-animation ${isPreview ? 'hidden' : ''}`} onClick={openChatContainer} aria-label="Open Chatbot">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
          <path d="M7 9h10v2H7z" />
          <path d="M7 6h7v2H7z" />
          <path d="M7 12h7v2H7z" />
        </svg>
      </button>

      {/* Main Chat Container */}
      <div id="chatContainer" className={`${isChatOpen ? 'open' : ''} ${isPreview ? 'is-preview' : ''}`}>
        {/* Chat Header */}
        <div id="chatHeader">
          <h3>{botName || 'ERP System Assistant'}</h3>
          <button onClick={closeChatContainer} aria-label="Close Chat">✖</button>
        </div>

        {/* Chatbox Messages Area */}
        <div id="chatbox" ref={chatboxRef}>
          {/* Rating Overlay */}
          {showRating && (
            <div className="rating-overlay">
              <div className="rating-bubble">
                <button className="rating-close-btn" onClick={closeRating} aria-label="Close rating">
                  ✖
                </button>

                {!ratingSubmitted ? (
                  <>
                    <h3>Rate Your Experience</h3>
                    <p>{ratingMessage}</p>
                    <div className="rating-options">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className={`rating-option ${star <= selectedRating ? 'selected' : ''}`}
                          onClick={() => handleStarClick(star)}
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <button className="option-button" onClick={submitRating} style={{ marginTop: '15px' }}>
                      Submit Rating
                    </button>
                    <button className="skip-btn" onClick={skipRating}>
                      Skip Rating
                    </button>
                  </>
                ) : (
                  <>
                    <div className="thank-you-message">
                      <h3>Thank You!</h3>
                      <p>We appreciate your feedback.</p>
                      {selectedRating > 0 && (
                        <div className="rating-display">
                          You rated us: {[...Array(selectedRating)].map((_, i) => (
                            <span key={i} className="star selected">★</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="option-button" onClick={handleChatAgain} style={{ marginTop: '15px' }}>
                      Chat Again
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Initial Chat Start Screen */}
          {!chatStarted && !showRating ? (
            <div className="no-messages-placeholder">
              <p>{welcomeMessage || 'Welcome to our support chat! How can we help with your ERP system questions today?'}</p>
              <button className="option-button" onClick={startConversationHandler} style={{ position: 'absolute', bottom: '80px', left: '25px', right: '25px', width: 'auto' }}>Start Conversation</button>
            </div>
          ) : (
            // Chat Conversation Area
            <div id="chatArea" className={showRating ? 'blurred' : ''}>
              {conversation.length === 0 && chatStarted && !showRating && (
                <div className="no-messages-placeholder">
                  <p>Start by typing a message or selecting an option!</p>
                </div>
              )}
              {conversation.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                  {msg.sender === 'status' ? (
                    <span className="status-message">{msg.message}</span>
                  ) : msg.isTyping ? (
                    <div className="typing-indicator">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: msg.message }} />
                  )}
                  {msg.options && msg.options.length > 0 && (
                    <div className="message-options">
                      {msg.options.map((option, optIndex) => (
                        <button
                          key={optIndex}
                          className="option-button"
                          onClick={() => handleOptionClick(option.value)}
                          disabled={index !== conversation.length - 1 || showRating}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chatbot Input Area */}
        <div className="chatbot-input-area" style={{ display: showRating ? 'none' : 'flex' }}>
          {aiCorrectionSuggestion && (
            <div className="ai-correction-suggestion">
              <p>Did you mean: "<strong>{aiCorrectionSuggestion.corrected}</strong>"?</p>
              <div className="suggestion-actions">
                <button onClick={acceptCorrection}>Yes</button>
                <button onClick={declineCorrection}>No</button>
              </div>
            </div>
          )}
          <input
            type="text"
            placeholder="Type your message..."
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUserTextInput();
              }
            }}
            // Disable input if options are present and it's the last message
            disabled={
              (conversation.length > 0 &&
                !conversation[conversation.length - 1].inputRequired &&
                conversation[conversation.length - 1].options.length > 0) ||
              showRating
            }
          />
          <button
            onClick={handleUserTextInput}
            // Disable send button if no message or conditions apply
            disabled={
              !userMessage.trim() ||
              (conversation.length > 0 &&
                !conversation[conversation.length - 1].inputRequired &&
                conversation[conversation.length - 1].options.length > 0) ||
              showRating
            }
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// Global function to render the chatbot widget
function renderChatbotWidget(config) {
  const mountPoint = document.getElementById(config.mountId || 'my-chatbot-widget');

  if (!mountPoint) {
    console.error('Chatbot widget mount point not found. Please ensure an element with id="my-chatbot-widget" exists.');
    return;
  }
  const root = ReactDOM.createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <ChatbotPreview
        botName={config.botName}
        welcomeMessage={config.welcomeMessage}
        fallbackMessage={config.fallbackMessage}
        nodes={config.nodes}
        connections={config.connections}
        isPreview={config.isPreview || false} // Pass isPreview from config
      />
    </React.StrictMode>
  );
}

// Expose the init function globally
window.MyChatbotWidget = {
  init: renderChatbotWidget,
};

// AI Response (GROQ API Integration)
export const getAIResponse = async (userMessage) => {
  try {
    console.log('Sending request to Groq API...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer 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`, // Replace with your actual key in production
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma2-9b-it",
        messages: [
          { role: "system", content: "You are a helpful chatbot assistant." },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      return `API Error (${response.status}): Please check your API key and settings.`;
    }

    const data = await response.json();
    console.log("API Response data:", data);

    if (!data.choices || data.choices.length === 0) {
      console.error("No choices in response:", data);
      return "Error: The AI service returned an empty response.";
    }
    let aiResponse = data.choices[0].message.content.trim();
    // Remove markdown bolding and list indicators if they appear from AI
    aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove double asterisks
    aiResponse = aiResponse.replace(/^\*\s*/gm, '• '); // Replace single asterisks at line start with bullet

    return aiResponse;
  } catch (error) {
    console.error("GROQ API error:", error);
    return `API Error: ${error.message || "Unknown error occurred"}`;
  }
};

// AI Correction for User Input (GROQ API Integration)
export const correctUserInputWithAI = async (userMessage) => {
  try {
    console.log('Sending user input to Groq API for correction...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer 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`, // Replace with your actual key in production
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma2-9b-it",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant specialized in correcting grammatical mistakes, spelling errors, and awkward phrasing in user's input. Your sole task is to provide the grammatically correct and polished version of the user's message. Do NOT add any extra information, greetings, or explanations. Only return the corrected text. If the input is already perfect, return it as is."
          },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1, // Low temperature for factual, consistent corrections
        max_tokens: 150,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API Correction Error (${response.status}):`, errorText);
      return userMessage; // Return original message on error
    }

    const data = await response.json();
    console.log("Groq API Correction Response data:", data);

    if (!data.choices || data.choices.length === 0) {
      console.error("No choices in correction response:", data);
      return userMessage; // Return original message if no choices
    }
    let correctedText = data.choices[0].message.content.trim();

    // Remove code block formatting if AI wraps response in it
    if (correctedText.startsWith('```') && correctedText.endsWith('```')) {
      correctedText = correctedText.substring(correctedText.indexOf('\n') + 1, correctedText.lastIndexOf('```')).trim();
    }

    return correctedText;
  } catch (error) {
    console.error("GROQ API correction error:", error);
    return userMessage; // Return original message on exception
  }
};

export default ChatbotPreview;