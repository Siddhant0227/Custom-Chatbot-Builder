
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ChatbotPreview from './components/ChatbotPreview';




const EmbeddableChatbot = ({
  botName,
  welcomeMessage,
  fallbackMessage,
  nodes,
  connections,
}) => {
  const [conversation, setConversation] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  // --- Chatbot Logic (Copied/Adapted from ChatbotBuilder's useEffect for preview mode) ---

  const simulateBotResponse = (userMessage, previousNodeId) => {
    setIsInitialLoading(true); // Indicate bot is "typing"

    setTimeout(() => {
      let nextMessage = null;
      let nextNodeToProcess;
      let foundConnection;

      // 1. Try to find a connection triggered by the user's message from the previous node
      if (previousNodeId) {
        foundConnection = connections.find(
          (conn) =>
            conn.sourceId === previousNodeId &&
            conn.sourceOutput.toLowerCase() === userMessage.toLowerCase() // Case-insensitive matching
        );
      }

      if (foundConnection) {
        nextNodeToProcess = nodes.find((node) => node.id === foundConnection?.targetId);
      }

      // 2. If no specific connection found, check for a default connection (e.g., from 'textinput' or 'message' nodes)
      if (!nextNodeToProcess && previousNodeId) {
        const prevNode = nodes.find(n => n.id === previousNodeId);
        if (prevNode && (prevNode.type === 'message' || prevNode.type === 'textinput' || prevNode.type === 'start')) {
          const defaultConnection = connections.find(
            (conn) =>
              conn.sourceId === previousNodeId &&
              conn.sourceOutput === 'output-1' // Assumes 'output-1' is your generic default output
          );
          if (defaultConnection) {
            nextNodeToProcess = nodes.find((node) => node.id === defaultConnection.targetId);
          }
        }
      }

      if (nextNodeToProcess) {
        nextMessage = {
          sender: 'bot',
          message: nextNodeToProcess.data.content,
          nodeId: nextNodeToProcess.id,
        };

        // Add options if the next node is multichoice or button
        if ((nextNodeToProcess.type === 'multichoice' || nextNodeToProcess.type === 'button') && nextNodeToProcess.data.options) {
          nextMessage.options = nextNodeToProcess.data.options.map(opt => ({
            label: opt.label,
            value: opt.value
          }));
        }
        setCurrentNodeId(nextNodeToProcess.id);
      } else {
        // Fallback if no specific node found or flow ends
        nextMessage = { sender: 'bot', message: fallbackMessage };
        setCurrentNodeId(null); // Reset current node if flow ends or is stuck
      }

      setConversation((prevConv) => {
        // Remove typing indicator from previous bot message if any
        const updatedPrevConv = prevConv.map(msg =>
          msg.isTyping ? { ...msg, isTyping: false } : msg
        );
        return [...updatedPrevConv, nextMessage];
      });
      setIsInitialLoading(false);
    }, 500); // Simulate bot typing delay
  };

  const handleUserMessage = (message, optionValue) => {
    // Add user's message to conversation
    const userMsg = { sender: 'user', message: optionValue || message };
    setConversation((prevConv) => [...prevConv, userMsg]);

    // Simulate bot response based on the message and current node
    simulateBotResponse(optionValue || message, currentNodeId);
  };

  // Initial chatbot setup effect (when the widget loads)
  useEffect(() => {
    setIsInitialLoading(true);
    setConversation([{ sender: 'bot', message: '...', isTyping: true }]); // Initial typing indicator

    setTimeout(() => {
      let initialMessages = [];
      const startNode = nodes.find(node => node.type === 'start');
      let initialCurrentNode;

      if (startNode) {
        initialMessages.push({ sender: 'bot', message: startNode.data.content, nodeId: startNode.id });
        initialCurrentNode = startNode;

        const firstStartConnection = connections.find(conn => conn.sourceId === startNode.id);
        if (firstStartConnection) {
          const nextNode = nodes.find(node => node.id === firstStartConnection.targetId);
          if (nextNode) {
            const messageData = {
              sender: 'bot',
              message: nextNode.data.content,
              nodeId: nextNode.id
            };

            if ((nextNode.type === 'multichoice' || nextNode.type === 'button') && nextNode.data.options) {
              messageData.options = nextNode.data.options.map(opt => ({
                label: opt.label,
                value: opt.value
              }));
            }
            initialMessages.push(messageData);
            initialCurrentNode = nextNode;
          }
        }
      } else {
        // Fallback if no start node found
        initialMessages.push({ sender: 'bot', message: welcomeMessage });
      }

      setConversation(initialMessages);
      setCurrentNodeId(initialCurrentNode?.id || null);
      setIsInitialLoading(false);
    }, 1000); // Simulate initial loading delay
  }, [nodes, connections, welcomeMessage]); // Dependencies: re-run if config changes

  return (
    <div className="embeddable-chatbot-wrapper"> {/* Add a wrapper div for styling if needed */}
      <ChatbotPreview
        botName={botName}
        welcomeMessage={welcomeMessage}
        fallbackMessage={fallbackMessage}
        conversation={conversation}
        setConversation={setConversation}
        nodes={nodes}
        connections={connections}
        currentNodeId={currentNodeId}
        setCurrentNodeId={setCurrentNodeId}
        isInitialLoading={isInitialLoading}
        onUserMessage={handleUserMessage} // Pass the user message handler to ChatbotPreview
      />
    </div>
  );
};

window.MyChatbotWidget = {
  init: (config) => { // No type annotations here
    const mountPoint = document.getElementById(config.mountId);
    if (mountPoint) {
      const root = ReactDOM.createRoot(mountPoint);
      root.render(
        <React.StrictMode>
          <EmbeddableChatbot
            botName={config.botName}
            welcomeMessage={config.welcomeMessage}
            fallbackMessage={config.fallbackMessage}
            nodes={config.nodes}
            connections={config.connections}
          />
        </React.StrictMode>
      );
    } else {
      console.error(`Chatbot mount point with ID '${config.mountId}' not found!`);
    }
  },
};