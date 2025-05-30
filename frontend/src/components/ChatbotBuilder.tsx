// ChatbotBuilder.tsx

import './ChatbotBuilder.css';
import React, { useState, useEffect, useRef } from 'react';
import ChatbotPreview from './ChatbotPreview';

interface Rule {
  id: string;
  trigger: string;
  response: string;
  isExactMatch: boolean;
  useAI: boolean;
}

interface NodeData {
  title: string;
  content: string;
  options?: { label: string; value: string; nextNodeId?: string }[];
  useAI?: boolean;
}

interface Node {
  id: string;
  type: 'start' | 'message' | 'multichoice' | 'button' | 'textinput' | 'rating' | 'end'; // Added 'end' type
  x: number;
  y: number;
  data: NodeData;
  outputs: string[];
}

interface Connection {
  id: string;
  sourceId: string;
  sourceOutput: string; // The value that triggers this connection (e.g., 'yes', 'option1')
  targetId: string;
  // No aiIntent here based on your provided connection structure
}

interface Message {
  sender: string;
  message: string;
  isTyping?: boolean;
  options?: { label: string; value: string }[];
  nodeId?: string;
}

interface NodeTypeDefinition {
  type: 'start' | 'message' | 'multichoice' | 'button' | 'textinput' | 'rating' | 'end'; // Added 'end' type
  label: string;
}


const ChatbotBuilder = () => {
  const [rules, setRules] = useState<Rule[]>([]); // This will now be dynamically generated for preview
  const [botName, setBotName] = useState('My Chatbot');
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can I help you today?');
  const [fallbackMessage, setFallbackMessage] = useState("I'm sorry, I don't understand. Can you please rephrase?");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  // Adjusted useNodesState and useEdgesState from React Flow to standard useState
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [creatingConnection, setCreatingConnection] = useState<any | null>(null); // This holds connection info
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSidebarView, setActiveSidebarView] = useState<'main' | 'nodeProperties'>('main');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMainSidebarSubView, setActiveMainSidebarSubView] = useState<'settings' | 'nodeTypes'>('settings');
  const [availableNodeTypes] = useState<NodeTypeDefinition[]>([
    { type: 'start', label: 'Start' },
    { type: 'message', label: 'Message' },
    { type: 'multichoice', label: 'Multi Choice' },
    { type: 'button', label: 'Button' },
    { type: 'textinput', label: 'Text Input' },
    { type: 'rating', label: 'Rating' },
    { type: 'end', label: 'End' }, // Added 'end' node type
  ]);

  // Ref for the hidden file input for import
  const fileInputRef = useRef<HTMLInputElement>(null);


  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const backToMainSidebar = () => {
    setActiveSidebarView('main');
    setSelectedNode(null); // Deselect node when going back to main view
    setActiveMainSidebarSubView('settings'); // Reset to settings view when coming back from node properties
  };

  useEffect(() => {
    if (nodes.length === 0) {
      setNodes([
        {
          id: 'start-1',
          type: 'start',
          x: 100,
          y: 120,
          data: {
            title: 'Start',
            content: 'Start your chatbot flow here',
            useAI: false,
          },
          outputs: ['output-1'],
        },
      ]);
    }
  }, [nodes.length, setNodes]); // Added setNodes to dependency array


  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasOffset({ x: rect.left, y: rect.top });
    }
  }, [canvasRef]);

  useEffect(() => {
    if (isPreviewMode) {
      setIsInitialLoading(true);
      setConversation([{ sender: 'bot', message: '...', isTyping: true }]);

      const generatedRules: Rule[] = [];
      const startNode = nodes.find(node => node.type === 'start');
      let initialCurrentNodeId: string | null = null;

      // Simulate loading delay
      setTimeout(() => {
        let initialMessages: Message[] = [];

        if (startNode) {
          initialMessages.push({ sender: 'bot', message: startNode.data.content });
          initialCurrentNodeId = startNode.id;

          const firstStartConnection = connections.find(conn => conn.sourceId === startNode.id);
          if (firstStartConnection) {
            const nextNode = nodes.find(node => node.id === firstStartConnection.targetId);
            if (nextNode) {
              const messageData: Message = {
                sender: 'bot',
                message: nextNode.data.content,
                nodeId: nextNode.id
              };

              // Add options if the node is multichoice or button
              if ((nextNode.type === 'multichoice' || nextNode.type === 'button') && nextNode.data.options) {
                messageData.options = nextNode.data.options.map(opt => ({
                  label: opt.label,
                  value: opt.value
                }));
              }

              initialMessages.push(messageData);
              initialCurrentNodeId = nextNode.id; // Set current node to the first connected node
            }
          }
        } else {
          initialMessages.push({ sender: 'bot', message: welcomeMessage });
        }

        setConversation(initialMessages);
        setCurrentNodeId(initialCurrentNodeId);
        setIsInitialLoading(false);

        connections.forEach(conn => {
          const targetNode = nodes.find(node => node.id === conn.targetId);
          if (targetNode) {
            generatedRules.push({
              id: generateId('rule'),
              trigger: conn.sourceOutput, // Connection label is the trigger
              response: targetNode.data.content, // Target node content is the response
              isExactMatch: true, // Assuming exact match for flow triggers
              useAI: targetNode.data.useAI || false, // Use AI setting from target node
            });
          }
        });

        setRules(generatedRules); // Set the dynamically generated rules
      }, 1000); // 1 second loading delay
    } else {
      setConversation([]); // Clear conversation when exiting preview
      setCurrentNodeId(null);
      setIsInitialLoading(false);
    }
  }, [isPreviewMode, nodes, connections, welcomeMessage]);

  const generateId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

const exportChatbot = () => {
    const chatbotConfig = {
      botName,
      welcomeMessage,
      fallbackMessage,
      nodes,
      connections,
      mountId: 'my-chatbot-widget',
    };

    // 1. --- Send data to Django Backend ---
    fetch('http://localhost:8000/api/save-chatbot/', { // <-- IMPORTANT: This is your Django backend URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatbotConfig),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.detail || JSON.stringify(errorData));
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Chatbot saved successfully to Django:', data);
        alert(`Chatbot '${chatbotConfig.botName}' saved successfully to Django!`);
        const configJsonString = JSON.stringify(chatbotConfig, null, 2); // null, 2 for pretty-printing

        const jsBundleUrl = 'https://your-domain.com/path/to/my-chatbot-widget.bundle.js'; 
    
        const cssBundleUrl = 'https://your-domain.com/path/to/static/css/main.6c9faa1e.css'; // <<<--- !!! UPDATE HASHED FILENAME AFTER EACH BUILD !!! --->>>

        const generatedScript = `
    <link rel="stylesheet" href="${cssBundleUrl}">

    <div id="${chatbotConfig.mountId}"></div>

    <script>
    window.myChatbotConfig = ${configJsonString};

    const script = document.createElement('script');
    script.id = 'my-chatbot-script';
    script.src = '${jsBundleUrl}';
    script.defer = true;

    script.onload = () => {
        if (window.MyChatbotWidget && window.MyChatbotWidget.init) {
            window.MyChatbotWidget.init(window.myChatbotConfig);
        } else {
            console.error('MyChatbotWidget or its init method not found after script load. Ensure the widget bundle is loaded correctly and window.MyChatbotWidget is exposed globally.');
        }
    };

    document.body.appendChild(script);
    </script>
    `;

        console.log("Generated Chatbot Script:\n", generatedScript);

        navigator.clipboard.writeText(generatedScript)
          .then(() => {
            alert('Chatbot script also copied to clipboard for embedding!');
          })
          .catch(err => {
            console.error('Failed to copy script to clipboard: ', err);
            alert('Failed to copy script to clipboard. Please copy it manually from the console.');
          });

      })
      .catch(error => {
        console.error('Error saving chatbot to Django:', error);
        alert(`Failed to save chatbot to Django: ${error.message || 'An unknown error occurred.'}`);
      });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const clickedNode = nodes.find((node) => {
      // Check if click is within node bounds
      return x >= node.x && x <= node.x + 200 && y >= node.y && y <= node.y + 80;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setActiveSidebarView('nodeProperties'); // Switch to node properties view
      setDraggingNode(clickedNode);
      setDragOffset({
        x: x - clickedNode.x,
        y: y - clickedNode.y,
      });
    } else {
      setSelectedNode(null);
      setActiveSidebarView('main'); // Go back to main view if no node is clicked
      setActiveMainSidebarSubView('settings'); // Default to settings
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode) {
      if (creatingConnection) {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        setCreatingConnection({
          ...creatingConnection,
          endX: x,
          endY: y,
        });
      }
      return;
    }

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === draggingNode.id ? { ...node, x: x - dragOffset.x, y: y - dragOffset.y } : node
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggingNode(null);

    if (creatingConnection) {
      const targetNode = nodes.find((node) => {
        if (node.id === creatingConnection.sourceNodeId) return false;

        const inputX = node.x; // Input point is on the left edge of the node
        const inputY = node.y + 40; // Mid-height of the node
        const distance = Math.sqrt(
          Math.pow(inputX - creatingConnection.endX, 2) + Math.pow(inputY - creatingConnection.endY, 2)
        )
        return distance < 20; // Within 20px radius of the input point
      });

      if (targetNode) {
        let sourceOutputIdentifier = 'output-1';
        const sourceNode = nodes.find(n => n.id === creatingConnection.sourceNodeId);
        if (sourceNode && (sourceNode.type === 'multichoice' || sourceNode.type === 'button')) {
          sourceOutputIdentifier = prompt("Enter the text/value that triggers this connection (e.g., 'Yes', 'Option A'):") || 'output-1';
        }
        setConnections([
          ...connections,
          {
            id: generateId('conn'),
            sourceId: creatingConnection.sourceNodeId,
            sourceOutput: sourceOutputIdentifier, // This will be the trigger for the next node
            targetId: targetNode.id,
          },
        ]);
      }
      setCreatingConnection(null);
    }
  };

  const startConnection = (nodeId: string, outputId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const sourceNode = nodes.find((node) => node.id === nodeId);
    if (!sourceNode) return;

    const outputX = sourceNode.x + 200; // Right edge of the node
    const outputY = sourceNode.y + 40; // Mid-height of the node

    setCreatingConnection({
      sourceNodeId: nodeId,
      sourceOutput: outputId, // This might be "output-1" or an option value for multichoice/button
      startX: outputX,
      startY: outputY,
      endX: outputX,
      endY: outputY,
    });
  };

  const addNewNode = (type: Node['type']) => {
    const nodeType = availableNodeTypes.find((nt) => nt.type === type);
    if (!nodeType) return;
    let title: string, content: string;
    let options: { label: string; value: string; nextNodeId?: string }[] | undefined;
    let useAI: boolean = false;
    let outputs: string[] = ['output-1']; // Default output for most nodes

    switch (type) {
      case 'start':
        title = 'Start';
        content = 'Start your chatbot flow here';
        break;
      case 'message':
        title = 'Message Card'; // Changed title to be more generic
        content = 'This is a general message.';
        break;
      case 'multichoice':
        title = 'Multi Choice Card';
        content = 'Please choose an option:';
        options = [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
        ];
         outputs = options.map(opt => opt.value);
        break;
      case 'button':
        title = 'Button Card';
        content = 'Click a button to continue:';
        options = [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ];
         outputs = options.map(opt => opt.value);
        break;
      case 'textinput':
        title = 'Text Input Card';
        content = 'Please type your response.';
        useAI = true; // Example: Text input might often lead to AI processing
        break;
      case 'rating':
        title = 'Rating Card';
        content = 'Please rate your experience (1-5).';
        outputs = []; // Rating nodes usually don't have outgoing connections from the node itself
        break;
      case 'end':
        title = 'End';
        content = 'Thank you for your time!';
        outputs = []; // End nodes don't have outgoing connections
        break;
      default:
        title = 'New Card';
        content = 'Card content';
        break;
    }

    const newNode: Node = {
      id: generateId(type),
      type,
      x: 300,
      y: 200,
      data: {
        title,
        content,
        options,
        useAI,
      },
      outputs: outputs, // Assign calculated outputs
    };

    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    setActiveSidebarView('nodeProperties'); // Automatically switch to node properties
  };

  const updateNodeData = (nodeId: string, field: keyof NodeData, value: any) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, [field]: value } } : node
      )
    );

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({
        ...selectedNode,
        data: { ...selectedNode.data, [field]: value },
      });
    }
  };

  const addNodeOption = (nodeId: string) => {
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId && (node.type === 'multichoice' || node.type === 'button')) {
        const newOption = { label: `New Option ${node.data.options ? node.data.options.length + 1 : 1}`, value: `option${Date.now()}` };
        return {
          ...node,
          data: {
            ...node.data,
            options: [...(node.data.options || []), newOption]
          }
        };
      }
      return node;
    }));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prevSelected => {
        if (prevSelected && (prevSelected.type === 'multichoice' || prevSelected.type === 'button')) {
          const newOption = { label: `New Option ${prevSelected.data.options ? prevSelected.data.options.length + 1 : 1}`, value: `option${Date.now()}` };
          return {
            ...prevSelected,
            data: {
              ...prevSelected.data,
              options: [...(prevSelected.data.options || []), newOption]
            }
          };
        }
        return prevSelected;
      });
    }
  };

  const updateNodeOption = (nodeId: string, optionIndex: number, field: 'label' | 'value', value: string) => {
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId && (node.type === 'multichoice' || node.type === 'button') && node.data.options) {
        const updatedOptions = [...node.data.options];
        updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };
        return {
          ...node,
          data: {
            ...node.data,
            options: updatedOptions
          }
        };
      }
      return node;
    }));
    if (selectedNode && selectedNode.id === nodeId && (selectedNode.type === 'multichoice' || selectedNode.type === 'button') && selectedNode.data.options) {
      setSelectedNode(prevSelected => {
        if (prevSelected) {
          const updatedOptions = [...prevSelected.data.options!];
          updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };
          return {
            ...prevSelected,
            data: {
              ...prevSelected.data,
              options: updatedOptions
            }
          };
        }
        return prevSelected;
      });
    }
  };

  const deleteNodeOption = (nodeId: string, optionIndex: number) => {
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId && (node.type === 'multichoice' || node.type === 'button') && node.data.options) {
        const updatedOptions = node.data.options.filter((_, index) => index !== optionIndex);
        return {
          ...node,
          data: {
            ...node.data,
            options: updatedOptions
          }
        };
      }
      return node;
    }));
    if (selectedNode && selectedNode.id === nodeId && (selectedNode.type === 'multichoice' || selectedNode.type === 'button') && selectedNode.data.options) {
      setSelectedNode(prevSelected => {
        if (prevSelected) {
          const updatedOptions = prevSelected.data.options!.filter((_, index) => index !== optionIndex);
          return {
            ...prevSelected,
            data: {
              ...prevSelected.data,
              options: updatedOptions
            }
          };
        }
        return prevSelected;
      });
    }
  };
  const deleteNode = (nodeId: string) => {
    if (nodeId === 'start-1') {
      alert("The 'Start' node cannot be deleted.");
      return;
    }
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
    setConnections((prevConnections) =>
      prevConnections.filter((conn) => conn.sourceId !== nodeId && conn.targetId !== nodeId)
    );
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
      setActiveSidebarView('main'); // Go back to main view after deleting
      setActiveMainSidebarSubView('settings'); // Reset to settings
    }
  };


  const deleteConnection = (connId: string) => {
    setConnections((prevConnections) => prevConnections.filter((conn) => conn.id !== connId));
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };


  // --- NEW: Handle Import Chatbot ---
  const handleImportButtonClick = () => {
    fileInputRef.current?.click(); // Programmatically click the hidden file input
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonContent = e.target?.result as string;
          const importedConfig = JSON.parse(jsonContent);

          // Basic validation for the imported JSON structure
          if (importedConfig.botName && importedConfig.nodes && Array.isArray(importedConfig.nodes) &&
            importedConfig.connections && Array.isArray(importedConfig.connections)) {

            setBotName(importedConfig.botName);
            setWelcomeMessage(importedConfig.welcomeMessage || 'Hello! Welcome to the imported bot.');
            setFallbackMessage(importedConfig.fallbackMessage || 'I didn\'t understand that. Can you rephrase?');

            // --- Node Mapping for YOUR custom structure ---
            const mappedNodes: Node[] = importedConfig.nodes.map((node: any) => ({
              id: node.id,
              type: node.type,
              x: node.x || 0, // Use x, y directly
              y: node.y || 0,
              data: {
                title: node.data?.title || '',
                content: node.data?.content || '',
                options: node.data?.options || [],
                useAI: node.data?.useAI ?? false,
              },
              outputs: node.outputs || [], // Preserve outputs array
            }));

            // --- Connection Mapping for YOUR custom structure ---
            const mappedConnections: Connection[] = importedConfig.connections.map((conn: any) => ({
              id: conn.id,
              sourceId: conn.sourceId,
              sourceOutput: conn.sourceOutput,
              targetId: conn.targetId,
            }));

            setNodes(mappedNodes);
            setConnections(mappedConnections);
            alert('Chatbot imported successfully!');
            console.log('Imported Chatbot Config:', importedConfig);

          } else {
            alert('Invalid JSON structure. Please ensure it contains "botName", "nodes", and "connections" arrays with correct properties.');
          }
        } catch (parseError) {
          console.error('Error parsing JSON file:', parseError);
          alert('Failed to parse JSON file. Please ensure it\'s a valid JSON.');
        }
      };
      reader.readAsText(file);
    }
  };


  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">No-Code Chatbot Builder</h1>
          <div className="header-buttons">
            <button onClick={exportChatbot} className="btn btn-export">
              Export Chatbot
            </button>
            {/* Import Button */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }} // Hide the actual file input
              onChange={handleFileChange}
              accept=".json" // Only accept JSON files
            />
            <button onClick={handleImportButtonClick} className="btn btn-export">
              Import Chatbot
            </button>
          </div>
        </div>
      </header>
      <button
        id="fixed-sidebar-toggle-btn"
        className={`fixed-sidebar-toggle ${!isSidebarOpen ? 'sidebar-closed-state' : ''}`}
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
      >
        {/* Always show the hamburger icon for the fixed toggle button */}
        <span className="icon-hamburger"><span></span></span>
      </button>


      {isPreviewMode ? (
        <ChatbotPreview
          botName={botName}
          welcomeMessage={welcomeMessage}
          fallbackMessage={fallbackMessage}
          nodes={nodes}
          connections={connections}
        />
      ) : (
        <div className={`flow-builder-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {isSidebarCollapsed && (
            <div className="sidebar-toggle-bar">
              {/* This div seems empty in your original code */}
            </div>
          )}

          {!isSidebarCollapsed && (
            <div className="sidebar">
              {/* Sidebar content container for transitions */}
              <div className={`sidebar-content-wrapper ${activeSidebarView}`}>
                {/* Main Sidebar View - Now with sub-views */}
                <div className="sidebar-view main-view">
                  <div className="sidebar-menu">
                    <button
                      className={`menu-option ${activeMainSidebarSubView === 'settings' ? 'active' : ''}`}
                      onClick={() => setActiveMainSidebarSubView('settings')}
                    >
                      Settings
                    </button>
                    <button
                      className={`menu-option ${activeMainSidebarSubView === 'nodeTypes' ? 'active' : ''}`}
                      onClick={() => setActiveMainSidebarSubView('nodeTypes')}
                    >
                      Input Cards
                    </button>
                  </div>

                  {activeMainSidebarSubView === 'settings' && (
                    <div className="sidebar-settings-content">
                      <div className="sidebar-section">
                        <h3>Chatbot Settings</h3>
                        <div className="setting-item">
                          <label>Name</label>
                          <input
                            type="text"
                            value={botName}
                            onChange={(e) => setBotName(e.target.value)}
                            className="input-box"
                          />
                        </div>
                        <div className="setting-item">
                          <label>Welcome</label>
                          <input
                            type="text"
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value)}
                            className="input-box"
                          />
                        </div>
                        <div className="setting-item">
                          <label>Fallback</label>
                          <input
                            type="text"
                            value={fallbackMessage}
                            onChange={(e) => setFallbackMessage(e.target.value)}
                            className="input-box"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMainSidebarSubView === 'nodeTypes' && (
                    <div className="sidebar-node-types-content">
                      <div className="sidebar-section">
                        <h3>Node Types</h3>
                        <div className="node-types">
                          {availableNodeTypes.map((nodeType) => (
                            <div
                              key={nodeType.type}
                              className={`node-type-item node-type-${nodeType.type.toLowerCase()}`}
                              onClick={() => addNewNode(nodeType.type)}
                            >
                              {nodeType.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Node Properties View */}
                <div className="sidebar-view node-properties-view">
                  {selectedNode && (
                    <div className="sidebar-section">
                      <div className="node-properties-back-area">
                        <button onClick={backToMainSidebar} className="back-btn">
                          &larr; Back
                        </button>
                      </div>
                      <div className="node-properties-header">
                        <h3>Node Properties</h3>
                      </div>
                      <div className="setting-item">
                        <label>Title</label>
                        <input
                          type="text"
                          value={selectedNode.data?.title || ''}
                          onChange={(e) => updateNodeData(selectedNode.id, 'title', e.target.value)}
                          className="input-box"
                        />
                      </div>
                      <div className="setting-item">
                        <label>Content</label>
                        <textarea
                          value={selectedNode.data?.content || ''}
                          onChange={(e) => updateNodeData(selectedNode.id, 'content', e.target.value)}
                          className="input-box"
                          rows={4}
                        />
                      </div>

                      {(selectedNode.type === 'multichoice' || selectedNode.type === 'button') && (
                        <div className="setting-item">
                          <label>Options</label>
                          {selectedNode.data.options?.map((option, index) => (
                            <div key={index} className="node-option-item">
                              <input
                                type="text"
                                placeholder="Label"
                                value={option.label}
                                onChange={(e) => updateNodeOption(selectedNode.id, index, 'label', e.target.value)}
                                className="input-box small-input label-input"
                              />
                              <input
                                type="text"
                                placeholder="Value (trigger)"
                                value={option.value}
                                onChange={(e) => updateNodeOption(selectedNode.id, index, 'value', e.target.value)}
                                className="input-box small-input value-input"
                              />
                              <button
                                onClick={() => deleteNodeOption(selectedNode.id, index)}
                                className="btn btn-delete-option"
                              >
                                X
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addNodeOption(selectedNode.id)} className="btn btn-add-option">
                            Add Option
                          </button>
                        </div>
                      )}

                      {(selectedNode.type === 'message' || selectedNode.type === 'textinput') && (
                        <div className="setting-item ai-toggle-section">
                          <input
                            type="checkbox"
                            id="aiToggle"
                            checked={selectedNode.data.useAI || false}
                            onChange={(e) => updateNodeData(selectedNode.id, 'useAI', e.target.checked)}
                          />
                          <label htmlFor="aiToggle">Use AI for response</label>
                        </div>
                      )}

                      <button onClick={() => deleteNode(selectedNode.id)} className="btn btn-delete-node">
                        Delete Node
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flow-canvas-container">
            <div className="flow-canvas-tools">
              <button onClick={handleZoomIn} className="zoom-btn">
                +
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomOut} className="zoom-btn">
                -
              </button>
            </div>
            <div
              className="flow-canvas"
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              <div className="canvas-content" style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
                <svg className="connections-layer" width="100%" height="100%">
                  {connections.map((conn) => {
                    const sourceNode = nodes.find((n) => n.id === conn.sourceId);
                    const targetNode = nodes.find((n) => n.id === conn.targetId);

                    if (!sourceNode || !targetNode) return null;
let startX: number;
                    let startY: number;

                    // Determine the exact source point for the connection
                    if ((sourceNode.type === 'multichoice' || sourceNode.type === 'button') && sourceNode.data.options) {
                      // Find the specific option's output point
                      const optionIndex = sourceNode.data.options?.findIndex(opt => opt.value === conn.sourceOutput);
                      if (optionIndex !== undefined && optionIndex > -1) {
                       
                        const NODE_HEADER_HEIGHT = 46.8; 
                        const NODE_CONTENT_TOP_OFFSET = 15; 
                        const NODE_OPTIONS_DISPLAY_TOP_PADDING = 10; // From .node-options-display padding-top in CSS
                        const OPTION_ITEM_HEIGHT = 40; // From .node-option-item-display min-height in CSS
                        const OPTION_ITEM_GAP = 8;
                        const OUTPUT_POINT_WIDTH = 16; 
                        const offsetToOptionsBlock = NODE_HEADER_HEIGHT + NODE_CONTENT_TOP_OFFSET;

                      
                        startX = sourceNode.x + 240 - (OUTPUT_POINT_WIDTH / 2);

        
                        startY = sourceNode.y + offsetToOptionsBlock + NODE_OPTIONS_DISPLAY_TOP_PADDING + (OPTION_ITEM_HEIGHT + OPTION_ITEM_GAP) * optionIndex + OPTION_ITEM_HEIGHT / 2;

                      } else {
                        startX = sourceNode.x + 232;
                        startY = sourceNode.y + 40; // Mid-height of the node for generic output point
                      }
                    } else {
                    
                      startX = sourceNode.x + 232; // Node width (240) - half of output point (8)
                      startY = sourceNode.y + 40; // Mid-height of the node
                    }
                    const endX = targetNode.x;         // Input point on the left edge
                    const endY = targetNode.y + 40;    // Mid-height of the node
                    const controlX1 = startX + 50;
                    const controlX2 = endX - 50;

                    return (
                      <g key={conn.id}>
                        <path
                          d={`M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`}
                          fill="none"
                          stroke="#888"
                          strokeWidth="2"
                          onClick={() => deleteConnection(conn.id)}
                          className="connection-path" // Add class for styling/hover
                        />
                        {/* Arrowhead */}
                        <circle cx={endX} cy={endY} r="5" fill="#888" />
                        {/* Connection Label */}
                        <text
                          x={(startX + endX) / 2}
                          y={(startY + endY) / 2 - 10}
                          fill="#555"
                          fontSize="10"
                          textAnchor="middle"
                          pointerEvents="none" // Important to allow clicking the path beneath
                        >
                          {conn.sourceOutput}
                        </text>
                      </g>
                    );
                  })}

                  {creatingConnection && (
                    <path
                      d={`M ${creatingConnection.startX} ${creatingConnection.startY}
                      C ${creatingConnection.startX + 50} ${creatingConnection.startY},
                      ${creatingConnection.endX - 50} ${creatingConnection.endY},
                      ${creatingConnection.endX} ${creatingConnection.endY}`}
                      fill="none"
                      stroke="#888"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}
                </svg>
                {nodes.map((node) => {
                  const nodeType = availableNodeTypes.find((nt) => nt.type === node.type);
                  return (
                    <div
                      key={node.id}
                      className={`flow-node ${selectedNode?.id === node.id ? 'selected' : ''} node-type-${node.type}`}
                      style={{ left: node.x, top: node.y }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                        setActiveSidebarView('nodeProperties'); // Switch to node properties view
                      }}
                      onMouseDown={(e) => {
                        // Allow dragging by clicking anywhere on the node except delete/output handles
                        if (!(e.target as HTMLElement).closest('.delete-node-btn, .output-point')) {
                          handleCanvasMouseDown(e); // Use the general canvas mouse down for dragging
                        }
                      }}
                    >
                      <div className="flow-node-header">
                        {node.data?.title || 'Unnamed Node'}
                        {node.id !== 'start-1' && ( // Prevent deleting the start node
                          <button
                            className="delete-node-btn"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent node selection/drag when clicking delete
                              deleteNode(node.id);
                            }}
                            title="Delete Node"
                          >
                            &#x1F5D1; {/* Trashcan icon */}
                          </button>
                        )}
                        {/* Input point for incoming connections */}
                        <div className="flow-node-input">
                          <div className="input-point" />
                        </div>
                      </div>
                      <div className="flow-node-content">
                        {node.data?.content || 'No content'}
                      </div>
                      {/* Render outputs only if node.outputs array is not empty AND not 'end' or 'rating' (if they truly have no outgoing connections) */}
                      {node.outputs && node.outputs.length > 0 && node.type !== 'end' && node.type !== 'rating' && (
                        <div className="flow-node-outputs">
                          {node.outputs.map((output: string) => (
                            <div
                              key={output}
                              className="output-point"
                              onMouseDown={(e) => startConnection(node.id, output, e)}
                              title={`Connect from ${output}`}
                            />
                          ))}
                        </div>
                      )}
                      {(node.type === 'multichoice' || node.type === 'button') && node.data.options && (
                        <div className="node-options-display">
                          {node.data.options.map((option, index) => (
                            <div
                              key={index}
                              className="node-option-item-display">
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flow-node-type">
                        {nodeType?.label || node.type.toUpperCase()} {/* Display label or type */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

       <ChatbotPreview
        botName={botName}
        welcomeMessage={welcomeMessage}
        fallbackMessage={fallbackMessage}
        nodes={nodes}
        connections={connections}
      /> 
    </div>
  );
};

export default ChatbotBuilder;