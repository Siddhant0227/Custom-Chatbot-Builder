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
 */

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
      />
    </React.StrictMode>
  );
}
window.MyChatbotWidget = {
  init: renderChatbotWidget,
};

export const getAIResponse = async (userMessage) => { // getAIResponse expects only userMessage
  try {
    console.log('Sending request to Groq API...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer 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`,
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
    aiResponse = aiResponse.replace(/\*/g, '');
    aiResponse = aiResponse.replace(/^\* /gm, '• ');
    aiResponse = aiResponse.replace("* ", "• ")
    return aiResponse;
  } catch (error) {
    console.error("GROQ API error:", error);
    return `API Error: ${error.message || "Unknown error occurred"}`;
  }
};

export const correctUserInputWithAI = async (userMessage) => {
  try {
    console.log('Sending user input to Groq API for correction...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer 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`, // <--- YOUR GROQ API KEY HERE
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma2-9b-it", // Or another suitable model
        messages: [
          {
            role: "system",

            content: "You are an AI assistant specialized in correcting grammatical mistakes, spelling errors, and awkward phrasing in user's input. Your sole task is to provide the grammatically correct and polished version of the user's message. Do NOT add any extra information, greetings, or explanations. Only return the corrected text. If the input is already perfect, return it as is."
          },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1, 
        max_tokens: 150,  
      }),
    }); if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API Correction Error (${response.status}):`, errorText);
     
      return userMessage;
    }

    const data = await response.json();
    console.log("Groq API Correction Response data:", data);

    if (!data.choices || data.choices.length === 0) {
      console.error("No choices in correction response:", data);
      return userMessage; // Return original if no correction provided
    }
    let correctedText = data.choices[0].message.content.trim();

    // The model might add markdown, so try to clean it if necessary
    if (correctedText.startsWith('```') && correctedText.endsWith('```')) {
        correctedText = correctedText.substring(correctedText.indexOf('\n') + 1, correctedText.lastIndexOf('```')).trim();
    }
    
    return correctedText;
  } catch (error) {
    console.error("GROQ API correction error:", error);
    return userMessage; // Return original message on error
  }
};

const ChatbotPreview = ({ botName, welcomeMessage, fallbackMessage, nodes, connections }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');
  const chatAreaRef = useRef(null);

  useEffect(() => {
    const chatIcon = document.getElementById("chatIcon");
    if (chatIcon) {
      const interval = setInterval(() => {
        chatIcon.classList.toggle('pulse-animation');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (chatAreaRef.current && !showRating) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [conversation, showRating]);

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
  };
  
 const startConversationHandler = () => {
    console.log('startConversationHandler: Starting conversation...');
    setChatStarted(true);

    const startNode = nodes.find(node => node.id === 'start-1'); // Finds your 'Start' node
    console.log('startConversationHandler: Found startNode:', startNode);

    if (startNode) {
      setCurrentNodeId(startNode.id); // Sets current node to Start node
      console.log('startConversationHandler: Setting currentNodeId to', startNode.id);
      processNode(startNode);         // Processes the Start node
    } else {
      console.warn('startConversationHandler: Start node with ID "start-1" not found. Falling back to welcome message.');
      addBotMessage(welcomeMessage || 'Hello! How can I help you with our ERP system today?', true);
    }
  };

  const addMessageToConversation = (sender, message, isTyping = false, options = [], inputRequired = false) => {
    setConversation((prevConv) => [
      ...prevConv,
      { sender, message, isTyping, options, inputRequired },
    ]);
  };
    const processNode = (node, userInputValue = '') => {
    let messageContent = node.data?.content || '';
    let options = [];
    let inputRequired = false;

    messageContent = messageContent.replace('{{userInput}}', userInputValue);

    switch (node.type) {
      case 'start':
      case 'message':
        addBotMessage(messageContent);
        const nextMessageConnection = connections.find(conn => conn.sourceId === node.id);
        if (nextMessageConnection) {
          const nextNode = nodes.find(n => n.id === nextMessageConnection.targetId);
          if (nextNode) {
            setCurrentNodeId(nextNode.id);
            setTimeout(() => processNode(nextNode), 500); // Small delay for flow
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
        // Show the rating bubble interface
        setRatingMessage(messageContent);
        setShowRating(true);
        break;
      case 'end':
         addMessageToConversation(
          'bot',  
          messageContent + ' Would you like to start over?', // Combined message
          false, // Not typing
          [{ label: 'Restart', value: 'restart' }], // The restart option
           false
        );
        break;
      default:
        addBotMessage(`Unhandled node type: ${node.type}. Content: ${messageContent}`);
    }
  }

  const processUserMessage = async (message) => {
    
    if (message.toLowerCase() === 'restart') {
        console.log('Restart command detected. Executing close and open chat sequence.');
        closeChatContainer();
        openChatContainer();
        return;
    }

    if (!message.trim()) return;

    addMessageToConversation('user', message); // Add user's ORIGINAL message to conversation
    setUserMessage(''); // Clear the input field

    // --- NEW: Grammar correction step ---
    addMessageToConversation('status', 'Correcting input...', false, [], false); // Show status
    const correctedMessage = await correctUserInputWithAI(message); // Call the AI for correction

    // Remove the "Correcting input..." status message
    setConversation((prevConv) => prevConv.filter((msg, idx) => !(msg.sender === 'status' && msg.message === 'Correcting input...')));

    // Optionally, show the user the corrected input (highly recommended for good UX)
    if (correctedMessage.toLowerCase() !== message.toLowerCase()) { // Only show if a correction actually happened
      addMessageToConversation('status', `(Corrected to: ${correctedMessage})`);
     
    }
   

    addMessageToConversation('status', 'Delivered'); // This status is for the original message flow
    addMessageToConversation('bot', '', true); // Bot typing indicator

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate thinking time

    setConversation((prevConv) =>
        prevConv.filter((msg) => !(msg.sender === 'bot' && msg.isTyping))
    ); // Remove typing indicator

    let nextNode = null;
    let aiResponseUsed = false;

    if (currentNodeId) {
        const currentNode = nodes.find(node => node.id === currentNodeId);

        if (currentNode) {
            // --- IMPORTANT: Use correctedMessage for all subsequent processing ---
            if (currentNode.data?.useAI) {
                console.log("AI is enabled for this node. Getting AI response...");
                const ai_raw_response = await getAIResponse(correctedMessage); // Use corrected message here
                addBotMessage(ai_raw_response);
                aiResponseUsed = true;

                const singleConnection = connections.find(conn => conn.sourceId === currentNode.id);
                if (singleConnection) {
                    nextNode = nodes.find(node => node.id === singleConnection.targetId);
                }
            } else {
                // For non-AI nodes (multichoice, button, textinput), match against correctedMessage
                if (currentNode.type === 'multichoice' || currentNode.type === 'button') {
                    const matchingConnection = connections.find(conn =>
                        conn.sourceId === currentNode.id && conn.sourceOutput === correctedMessage // Use corrected message here
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
        processNode(nextNode, correctedMessage); // Use corrected message here
    } else if (!aiResponseUsed) {
        addMessageToConversation(
            'bot',
            fallbackMessage || "I'm sorry, I didn't understand that. Would you like to start over?",
            false,
            [{ label: 'Restart', value: 'restart' }],
            false
        );
    }
  };

  const addBotMessage = (message, showTyping = false, options = [], inputRequired = false) => {
    if (showTyping) {
      addMessageToConversation('bot', '', true, [], false); // Typing indicator
      setTimeout(() => {
        setConversation((prevConv) =>
          prevConv.map((msg) =>
            msg.sender === 'bot' && msg.isTyping ? { ...msg, message: message, isTyping: false, options: options, inputRequired: inputRequired } : msg
          )
        );
      }, 1000); // Simulate typing delay
    } else {
      addMessageToConversation('bot', message, false, options, inputRequired);
    }
  };

  const handleOptionClick = (optionValue) => {
    processUserMessage(optionValue);
  };

  const handleUserTextInput = () => {
    if (userMessage.toLowerCase() === 'restart') {
      closeChatContainer(); // This will also trigger startConversationHandler
      openChatContainer();
    } else {
      processUserMessage(userMessage);
    }
  };

  const handleStarClick = (rating) => {
    setSelectedRating(rating);
  };

  const submitRating = () => {
    setRatingSubmitted(true);
    // You can add code here to save the rating to your backend
    console.log('User rated:', selectedRating, 'stars');
  };

  // New function to skip rating and continue
  const skipRating = () => {
    setShowRating(false);
    // Find the next node after the rating node and continue the flow
    const ratingNode = nodes.find(node => node.id === currentNodeId);
    if (ratingNode) {
      const nextConnection = connections.find(conn => conn.sourceId === ratingNode.id);
      if (nextConnection) {
        const nextNode = nodes.find(node => node.id === nextConnection.targetId);
        if (nextNode) {
          setCurrentNodeId(nextNode.id);
          processNode(nextNode);
        }
      }
    }
  };

  // New function to close rating dialog
  const closeRating = () => {
    setShowRating(false);
    setSelectedRating(0);
    setRatingSubmitted(false);
    setRatingMessage('');
    // Continue to the next node without rating
    skipRating();
  };

  const handleChatAgain = () => {
    console.log('handleChatAgain: Initiating full chatbot reset...');
    setShowRating(false);
    setRatingSubmitted(false);
    setSelectedRating(0);
    setRatingMessage('');
    setConversation([]);       // Clears conversation history
    setCurrentNodeId(null);    // Resets current node
    setChatStarted(false);  
    setTimeout(() => {
        console.log('handleChatAgain: Calling startConversationHandler...');
        startConversationHandler(); // This should initiate the conversation again
    }, 100); // A small delay of 100ms
   // This function will then re-initiate the conversation
  };

  return (
    <>
      <button id="chatIcon" className="pulse-animation" onClick={openChatContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
          <path d="M7 9h10v2H7z" />
          <path d="M7 6h7v2H7z" />
          <path d="M7 12h7v2H7z" />
        </svg>
      </button>

      <div id="chatContainer" className={isChatOpen ? 'open' : ''}>
        <div id="chatbox">
          <div id="chatboxHeader">{botName || 'ERP System Assistant'}</div>
          <span id="minimizeIcon" onClick={closeChatContainer}>✖</span>
          <span id="clearIcon" onClick={() => setConversation([])}>🧹</span>

          {/* Rating Bubble Interface */}
          {showRating && (
            <div className="rating-overlay">
              <div className="rating-bubble">
                {/* Close button for rating dialog */}
                <button className="rating-close-btn" onClick={closeRating} aria-label="Close rating">
                  ✖
                </button>
                
                {!ratingSubmitted ? (
                  <>
                    <h3>Rate Your Experience</h3>
                    <p>{ratingMessage}</p>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className={`star ${star <= selectedRating ? 'selected' : ''}`}
                          onClick={() => handleStarClick(star)}
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <div className="rating-buttons">
                      <button className="rating-btn submit-btn" onClick={submitRating}>
                        Submit Rating
                      </button>
                      <button className="rating-btn skip-btn" onClick={skipRating}>
                        Skip Rating
                      </button>
                    </div>
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
                    <div className="rating-buttons">
                      <button className="rating-btn chat-again-btn" onClick={handleChatAgain}>
                        Chat Again
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {!chatStarted ? (
            <>
              <p id="chatDescription">{welcomeMessage || 'Welcome to our support chat! How can we help with your ERP system questions today?'}</p>
              <button id="startChatBtn" onClick={startConversationHandler}>Start Conversation</button>
            </>
          ) : (
            <>
              <div id="chatArea" className={`open ${showRating ? 'blurred' : ''}`} ref={chatAreaRef}>
                {conversation.map((msg, index) => (
                  <div key={index} className={msg.sender}>
                    {msg.sender === 'status' ? (
                      <span className="status">{msg.message}</span>
                    ) : msg.isTyping ? (
                      <div className="typing-animation">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: msg.message }} />
                    )}
                    {msg.options && msg.options.length > 0 && (
                      <div className="button-container">
                        {msg.options.map((option, optIndex) => (
                          <button
                            key={optIndex}
                            className="predefined-btn"
                            onClick={() => handleOptionClick(option.value)}
                            // Ensure disabled state matches your desired logic
                            disabled={index !== conversation.length - 1 || conversation[conversation.length - 1]?.inputRequired || showRating}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div id="inputBox" style={{ display: showRating ? 'none' : 'flex' }}>
                <input
                  id="textInput"
                  type="text"
                  placeholder="Type your message..."
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUserTextInput();
                    }
                  }}
                  // Ensure disabled state matches your desired logic
                  disabled={conversation.length > 0 && !conversation[conversation.length - 1].inputRequired && conversation[conversation.length - 1].options.length > 0}
                />
                <button
                  id="sendBtn"
                  onClick={handleUserTextInput}
         
                  disabled={conversation.length > 0 && !conversation[conversation.length - 1].inputRequired && conversation[conversation.length - 1].options.length > 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatbotPreview;