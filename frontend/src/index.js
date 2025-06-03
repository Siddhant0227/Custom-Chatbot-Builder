// src/index.js (or src/main.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.js'; // Ensure this points to your App.jsx

import './index.css'; // Or whatever your main CSS file is

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
   
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);