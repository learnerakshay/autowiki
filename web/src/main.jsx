import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/tokens.css'
import './styles/layout.css'
import './styles/interaction.css'
import App from './App.jsx'
import { installMotionTokens } from './lib/motion.js'

// The shared spring curves are published as CSS tokens before the first render, so every route (not just the landing) can use them.
installMotionTokens()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
