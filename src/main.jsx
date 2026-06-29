import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App.jsx'
import './index.css'
import './i18n/index.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
        }}
        richColors
      />
    </BrowserRouter>
  </React.StrictMode>,
)
