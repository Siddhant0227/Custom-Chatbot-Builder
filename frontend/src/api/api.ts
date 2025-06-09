// src/utils/api.ts

export const fetchCsrfToken = async () => {
  try {
    const response = await fetch('/api/csrf-token/', { credentials: 'include' });
    if (!response.ok) {
        // Handle HTTP errors
        const errorText = await response.text();
        throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    localStorage.setItem('csrftoken', data.csrftoken);
    console.log("CSRF token fetched and stored.");
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
  }
};

// You might also add a helper for authenticated fetch requests here later
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const csrftoken = localStorage.getItem('csrftoken');
    if (!csrftoken) {
        console.error("CSRF token missing. Please ensure it's fetched before making authenticated requests.");
        // Optionally, re-fetch or redirect to login
        await fetchCsrfToken(); // Attempt to re-fetch
        const newCsrftoken = localStorage.getItem('csrftoken');
        if (!newCsrftoken) throw new Error("Could not retrieve CSRF token.");
        options.headers = {
            ...options.headers,
            'X-CSRFToken': newCsrftoken,
        };
    } else {
        options.headers = {
            ...options.headers,
            'X-CSRFToken': csrftoken,
        };
    }

    options.credentials = 'include';

    return fetch(url, options);
};