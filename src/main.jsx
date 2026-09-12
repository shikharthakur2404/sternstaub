import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode removed intentionally:
// transferControlToOffscreen() can only be called once per canvas element.
// StrictMode's double-mount in development would call it twice → InvalidStateError.
// Canvas/Worker render pipelines are incompatible with StrictMode's effect double-invoke.
createRoot(document.getElementById('root')).render(
  <App />
)
