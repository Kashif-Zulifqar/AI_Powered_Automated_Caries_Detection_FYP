import React from "react";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
 <React.StrictMode>
    <BrowserRouter> 
      {/* 👈 App and ALL its children must be inside the Router */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
