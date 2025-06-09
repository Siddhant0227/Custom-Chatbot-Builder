// src/components/ChatbotBuilder.tsx
import './ChatbotBuilder.css';
import React, { useState, useEffect, useRef } from 'react';
import ChatbotPreview from './ChatbotPreview';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import { useAuth } from '../AuthContext.tsx';

// Define interfaces for clarity, matching your Chatbot interface structure
// (These should ideally be in a shared types file or defined consistently)
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
    type: 'start' | 'message' | 'multichoice' | 'button' | 'textinput' | 'rating' | 'end';
    x: number;
    y: number;
    data: NodeData;
    outputs: string[];
}

interface Connection {
    id: string;
    sourceId: string;
    sourceOutput: string;
    targetId: string;
}

interface Message {
    sender: string;
    message: string;
    isTyping?: boolean;
    options?: { label: string; value: string }[];
    nodeId?: string;
}

interface NodeTypeDefinition {
    type: 'start' | 'message' | 'multichoice' | 'button' | 'textinput' | 'rating' | 'end';
    label: string;
}

// Interface for the full Chatbot object as returned by your backend
interface Chatbot {
    id: string;
    name: string;
    configuration: {
        welcomeMessage: string;
        fallbackMessage: string;
        nodes: Node[];
        connections: Connection[];
        botName: string; // Assuming botName is part of configuration or top-level
    };
    user: string;
    created_at: string;
    updated_at: string;
}


const API_BASE_URL = 'http://127.0.0.1:8000';

const ChatbotBuilder = () => {
    // Hooks and State
    const { chatbotId } = useParams<{ chatbotId: string }>(); // <--- NEW: Get chatbotId from URL
    const { isAuthenticated, logout } = useAuth(); // Assuming useAuth is imported
    const navigate = useNavigate();

    const [rules, setRules] = useState<Rule[]>([]);
    const [botName, setBotName] = useState('My Chatbot');
    const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can I help you today?');
    const [fallbackMessage, setFallbackMessage] = useState("I'm sorry, I don't understand. Can you please rephrase?");
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [conversation, setConversation] = useState<Message[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [draggingNode, setDraggingNode] = useState<Node | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [creatingConnection, setCreatingConnection] = useState<any | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // You had this, but it was unused. Assuming it controls sidebar visibility.
    const [activeSidebarView, setActiveSidebarView] = useState<'main' | 'nodeProperties'>('main');
    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(false); // Used for preview mode
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeMainSidebarSubView, setActiveMainSidebarSubView] = useState<'settings' | 'nodeTypes'>('settings');
    const [isLoadingChatbotData, setIsLoadingChatbotData] = useState(true); // <--- NEW: State for loading existing chatbot data
    const [error, setError] = useState<string | null>(null); // <--- NEW: State for error messages

    const [availableNodeTypes] = useState<NodeTypeDefinition[]>([
        { type: 'start', label: 'Start' },
        { type: 'message', label: 'Message' },
        { type: 'multichoice', label: 'Multi Choice' },
        { type: 'button', label: 'Button' },
        { type: 'textinput', label: 'Text Input' },
        { type: 'rating', label: 'Rating' },
        { type: 'end', label: 'End' },
    ]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Utility Functions ---
    const generateId = (prefix: string) => {
        return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const backToMainSidebar = () => {
        setActiveSidebarView('main');
        setSelectedNode(null);
        setActiveMainSidebarSubView('settings');
    };
    const BacktoDashboard = () => {
        navigate('/dashboard');
    }

    // --- EFFECTS ---

    

    // Effect to initialize the 'Start' node if no nodes exist (for new chatbots)



// Keep this existing useEffect, just ensure the 'new chatbot' branch is correct
useEffect(() => {
    const fetchChatbotData = async () => {
        if (!isAuthenticated) {
            setError("You must be logged in to build chatbots.");
            setIsLoadingChatbotData(false);
            navigate('/login');
            return;
        }

        // --- THIS IS THE CRUCIAL PART TO ENSURE FOR NEW CHATBOTS ---
        if (!chatbotId || chatbotId === 'new-mock-chatbot-id') {
            setBotName('My New Chatbot');
            setWelcomeMessage('Hello! How can I help you today?');
            setFallbackMessage("I'm sorry, I don't understand. Can you please rephrase?");
            setNodes([ // This ensures the start node is always loaded for a new bot
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
            setConnections([]); // Ensure connections are empty for a new bot
            setIsLoadingChatbotData(false);
            setError(null);
            return; // Exit here, no need to fetch if it's a new bot
        }
        // --- END OF CRUCIAL PART ---


        setIsLoadingChatbotData(true);
        setError(null);
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            setError("Authentication token not found. Please log in again.");
            setIsLoadingChatbotData(false);
            logout();
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/chatbots/${chatbotId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${authToken}`,
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data: Chatbot = await response.json();
                setBotName(data.name || 'My Chatbot');
                setWelcomeMessage(data.configuration.welcomeMessage || 'Hello! How can I help you today?');
                setFallbackMessage(data.configuration.fallbackMessage || "I'm sorry, I don't understand. Can you please rephrase?");
                setNodes(data.configuration.nodes || []);
                setConnections(data.configuration.connections || []);
                setError(null);
            } else if (response.status === 403 || response.status === 401 || response.status === 404) {
                setError("Chatbot not found or you don't have permission to access it. Redirecting to dashboard.");
                logout(); // Logout if token invalid or no permission
                navigate('/dashboard');
            } else {
                const errorData = await response.json();
                setError(errorData.message || errorData.detail || "Failed to fetch chatbot details.");
                console.error("API Error fetching chatbot details:", errorData);
            }
        } catch (err: any) {
            console.error("Network error fetching chatbot details:", err);
            setError("Network error. Could not connect to the server to fetch chatbot details.");
        } finally {
            setIsLoadingChatbotData(false);
        }
    };

    fetchChatbotData();
}, [chatbotId, isAuthenticated, logout, navigate]); // Dependencies remain the same


    // Effect to update canvas offset
    useEffect(() => {
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            setCanvasOffset({ x: rect.left, y: rect.top });
        }
    }, [canvasRef]);

    // Effect for preview mode initialization
    useEffect(() => {
        if (isPreviewMode) {
            setIsInitialLoading(true);
            setConversation([{ sender: 'bot', message: '...', isTyping: true }]);

            const generatedRules: Rule[] = [];
            const startNode = nodes.find(node => node.type === 'start');
            let initialCurrentNodeId: string | null = null;

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

                            if ((nextNode.type === 'multichoice' || nextNode.type === 'button') && nextNode.data.options) {
                                messageData.options = nextNode.data.options.map(opt => ({
                                    label: opt.label,
                                    value: opt.value
                                }));
                            }

                            initialMessages.push(messageData);
                            initialCurrentNodeId = nextNode.id;
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
                            trigger: conn.sourceOutput,
                            response: targetNode.data.content,
                            isExactMatch: true,
                            useAI: targetNode.data.useAI || false,
                        });
                    }
                });
                setRules(generatedRules);
            }, 1000);
        } else {
            setConversation([]);
            setCurrentNodeId(null);
            setIsInitialLoading(false);
        }
    }, [isPreviewMode, nodes, connections, welcomeMessage]);


    // --- Event Handlers ---

    const exportChatbot = () => {
        const chatbotConfig = {
            botName,
            welcomeMessage,
            fallbackMessage,
            nodes,
            connections,
            mountId: 'my-chatbot-widget',
        };

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert('Authentication token not found. Please log in first.');
            return;
        }

        const method = chatbotId && chatbotId !== 'new-mock-chatbot-id' ? 'PUT' : 'POST'; // Use PUT for existing, POST for new
        const url = chatbotId && chatbotId !== 'new-mock-chatbot-id'
            ? `${API_BASE_URL}/api/chatbots/${chatbotId}/` // Update existing
            : `${API_BASE_URL}/api/chatbots/`; // Create new

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`,
            },
            body: JSON.stringify({
                name: botName, // Send name at the top level
                configuration: chatbotConfig // Send the full config as 'configuration' field
            }),
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

                // If it was a new chatbot, navigate to its specific ID for further edits
                if (method === 'POST' && data.id) {
                    navigate(`/build/${data.id}`);
                }
                const configJsonString = JSON.stringify(chatbotConfig, null, 2);

                const jsBundleUrl = 'https://your-domain.com/path/to/my-chatbot-widget.bundle.js';
                const cssBundleUrl = 'https://your-domain.com/path/to/static/css/main.6c9faa1e.css';

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
            return x >= node.x && x <= node.x + 200 && y >= node.y && y <= node.y + 80;
        });

        if (clickedNode) {
            setSelectedNode(clickedNode);
            setActiveSidebarView('nodeProperties');
            setDraggingNode(clickedNode);
            setDragOffset({
                x: x - clickedNode.x,
                y: y - clickedNode.y,
            });
        } else {
            setSelectedNode(null);
            setActiveSidebarView('main');
            setActiveMainSidebarSubView('settings');
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

                const inputX = node.x;
                const inputY = node.y + 40; // Assuming input is at the center-left of the node for simplicity
                const distance = Math.sqrt(
                    Math.pow(inputX - creatingConnection.endX, 2) + Math.pow(inputY - creatingConnection.endY, 2)
                )
                return distance < 20;
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
                        sourceOutput: sourceOutputIdentifier,
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

        const outputX = sourceNode.x + 200;
        const outputY = sourceNode.y + 40;

        setCreatingConnection({
            sourceNodeId: nodeId,
            sourceOutput: outputId,
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
        let outputs: string[] = ['output-1'];

        switch (type) {
            case 'start':
                title = 'Start';
                content = 'Start your chatbot flow here';
                break;
            case 'message':
                title = 'Message Card';
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
                useAI = true;
                break;
            case 'rating':
                title = 'Rating Card';
                content = 'Please rate your experience (1-5).';
                outputs = [];
                break;
            case 'end':
                title = 'End';
                content = 'Thank you for your time!';
                outputs = [];
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
            outputs: outputs,
        };

        setNodes([...nodes, newNode]);
        setSelectedNode(newNode);
        setActiveSidebarView('nodeProperties');
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
                    },
                    outputs: [...node.outputs, newOption.value] // Update outputs for new option
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
                        },
                        outputs: [...prevSelected.outputs, newOption.value]
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
                // Store the old value if we're changing 'value' to update connections
                const oldValue = field === 'value' ? updatedOptions[optionIndex].value : undefined;

                updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };

                // Update connections if the 'value' (sourceOutput) changes
                if (field === 'value' && oldValue) {
                    setConnections(prevConnections =>
                        prevConnections.map(conn =>
                            conn.sourceId === nodeId && conn.sourceOutput === oldValue
                                ? { ...conn, sourceOutput: value }
                                : conn
                        )
                    );
                }

                // Update node outputs if the 'value' changes
                const updatedOutputs = [...node.outputs];
                if (field === 'value' && oldValue) {
                    const outputIndex = updatedOutputs.indexOf(oldValue);
                    if (outputIndex !== -1) {
                        updatedOutputs[outputIndex] = value;
                    }
                }


                return {
                    ...node,
                    data: {
                        ...node.data,
                        options: updatedOptions
                    },
                    outputs: updatedOutputs // Update outputs array
                };
            }
            return node;
        }));

        // Also update selectedNode state for immediate UI reflection
        if (selectedNode && selectedNode.id === nodeId && (selectedNode.type === 'multichoice' || selectedNode.type === 'button') && selectedNode.data.options) {
            setSelectedNode(prevSelected => {
                if (prevSelected) {
                    const updatedOptions = [...prevSelected.data.options!];
                    updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };

                    // Update outputs for selectedNode as well
                    const updatedOutputs = [...prevSelected.outputs];
                    if (field === 'value') {
                        const outputIndex = updatedOutputs.indexOf(prevSelected.data.options![optionIndex].value);
                        if (outputIndex !== -1) {
                            updatedOutputs[outputIndex] = value;
                        }
                    }

                    return {
                        ...prevSelected,
                        data: {
                            ...prevSelected.data,
                            options: updatedOptions
                        },
                        outputs: updatedOutputs
                    };
                }
                return prevSelected;
            });
        }
    };


    const deleteNodeOption = (nodeId: string, optionIndex: number) => {
        setNodes(prevNodes => prevNodes.map(node => {
            if (node.id === nodeId && (node.type === 'multichoice' || node.type === 'button') && node.data.options) {
                const optionToDeleteValue = node.data.options[optionIndex].value;
                const updatedOptions = node.data.options.filter((_, index) => index !== optionIndex);
                const updatedOutputs = node.outputs.filter(output => output !== optionToDeleteValue);

                // Delete connections originating from this option
                setConnections(prevConnections =>
                    prevConnections.filter(conn =>
                        !(conn.sourceId === nodeId && conn.sourceOutput === optionToDeleteValue)
                    )
                );

                return {
                    ...node,
                    data: {
                        ...node.data,
                        options: updatedOptions
                    },
                    outputs: updatedOutputs // Update outputs array
                };
            }
            return node;
        }));

        if (selectedNode && selectedNode.id === nodeId && (selectedNode.type === 'multichoice' || selectedNode.type === 'button') && selectedNode.data.options) {
            setSelectedNode(prevSelected => {
                if (prevSelected) {
                    const optionToDeleteValue = prevSelected.data.options![optionIndex].value;
                    const updatedOptions = prevSelected.data.options!.filter((_, index) => index !== optionIndex);
                    const updatedOutputs = prevSelected.outputs.filter(output => output !== optionToDeleteValue);

                    return {
                        ...prevSelected,
                        data: {
                            ...prevSelected.data,
                            options: updatedOptions
                        },
                        outputs: updatedOutputs
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
            setActiveSidebarView('main');
            setActiveMainSidebarSubView('settings');
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

    const handleImportButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonContent = e.target?.result as string;
                    const importedConfig = JSON.parse(jsonContent);

                    if (importedConfig.botName && importedConfig.nodes && Array.isArray(importedConfig.nodes) &&
                        importedConfig.connections && Array.isArray(importedConfig.connections)) {

                        setBotName(importedConfig.botName);
                        setWelcomeMessage(importedConfig.welcomeMessage || 'Hello! Welcome to the imported bot.');
                        setFallbackMessage(importedConfig.fallbackMessage || 'I didn\'t understand that. Can you rephrase?');

                        const mappedNodes: Node[] = importedConfig.nodes.map((node: any) => ({
                            id: node.id,
                            type: node.type,
                            x: node.x || 0,
                            y: node.y || 0,
                            data: {
                                title: node.data?.title || '',
                                content: node.data?.content || '',
                                options: node.data?.options || [],
                                useAI: node.data?.useAI ?? false,
                            },
                            outputs: node.outputs || [],
                        }));

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


    // --- Render Logic (Simplified for brevity, assuming existing HTML structure) ---
    if (isLoadingChatbotData) {
        return (
            <div className="chatbot-builder loading-screen">
                <div className="loading-spinner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader animate-spin">
                        <line x1="12" x2="12" y1="2" y2="6" /><line x1="12" x2="12" y1="18" y2="22" /><line x1="4.93" x2="7.76" y1="4.93" y2="7.76" /><line x1="16.24" x2="19.07" y1="16.24" y2="19.07" /><line x1="2" x2="6" y1="12" y2="12" /><line x1="18" x2="22" y1="12" y2="12" /><line x1="4.93" x2="7.76" y1="19.07" y2="16.24" /><line x1="16.24" x2="19.07" y1="7.76" y2="4.93" />
                    </svg>
                    <p>Loading chatbot configuration...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="chatbot-builder error-screen">
                <p className="error-message">{error}</p>
                <button onClick={() => navigate('/dashboard')} className="btn-back-dashboard">Go to Dashboard</button>
            </div>
        );
    }


  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">No-Code Chatbot Builder</h1>
          <div className="header-buttons">
            <button onClick={BacktoDashboard} className="btn btn-export">
              Back
            </button>

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