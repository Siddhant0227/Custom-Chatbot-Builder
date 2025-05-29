export async function saveChatbot({ name, config, token, id }) {
  const method = id ? 'PUT' : 'POST';
  const url = id
    ? `/api/chatbotapi/${id}/`
    : '/api/chatbotapi/';
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, config }),
  });
  if (!response.ok) throw new Error('Failed to save chatbot');
  return await response.json();
}

export async function fetchChatbots(token) {
  const response = await fetch('/api/chatbotapi/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch chatbots');
  return await response.json();
}