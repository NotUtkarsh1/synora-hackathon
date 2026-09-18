import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RateLimitProvider } from './context/RateLimitContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RateLimitProvider>
      <App />
    </RateLimitProvider>
  </StrictMode>,
);
