// src/api/aiService.js (or .ts) - THIS FILE SHOULD CALL YOUR DJANGO BACKEND
export const getAIResponse = async (userMessage, conversationContext = []) => {
  try {
    console.log('Sending request to Django backend for AI response...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { // <--- THIS IS THE CORRECT URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_message: userMessage,
        conversation_history: conversationContext
      }),
    });

        if (!response.ok) {
      let errorMessage = `Backend API error: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error(`Backend API Error (${response.status}):`, errorData);
        // Try to get a more specific error message from the backend's response
        if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else if (errorData.detail) { // Common for DRF errors
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else {
          errorMessage = JSON.stringify(errorData); // Fallback to stringifying the whole error object
        }
      } catch (jsonError) {
        // If the response wasn't even valid JSON, just use the status text
        console.error("Failed to parse error response as JSON:", jsonError);
        errorMessage = `Backend API error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Backend AI Response data:", data);
    if (!data.ai_response) {
        // This might happen if the backend returns 200 OK but without ai_response field
        throw new Error("Django backend did not return 'ai_response' in a 200 OK response.");
    }
    return data.ai_response;
  } catch (error) {
    console.error("Error fetching AI response from Django backend:", error);
    // Ensure error.message is always a string
    return `API Error: ${error instanceof Error ? error.message : String(error)}`;
  }
};
