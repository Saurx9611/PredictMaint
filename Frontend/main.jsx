import React from 'react'
import ReactDOM from 'react-dom/client'
import Dashboard from './Dashboard'
// We might need to import tailwind here if you set it up, 
// but for now let's just get it running.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>,
)