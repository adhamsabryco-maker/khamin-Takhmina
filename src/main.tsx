const originalError = console.error;
console.error = function(...args) {
  originalError.apply(console, args);
  if (typeof document !== 'undefined' && document.body) {
    const el = document.createElement('div');
    el.style.color = 'red';
    el.style.background = 'white';
    el.style.padding = '10px';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.zIndex = '999999';
    el.textContent = 'Console Error: ' + args.join(' ');
    document.body.appendChild(el);
  }
};
window.addEventListener('error', (e) => {
  if (typeof document !== 'undefined' && document.body) {
    const el = document.createElement('div');
    el.style.color = 'red';
    el.style.background = 'yellow';
    el.style.padding = '10px';
    el.style.position = 'fixed';
    el.style.top = '50px';
    el.style.left = '0';
    el.style.zIndex = '999999';
    el.textContent = 'Uncaught Error: ' + e.message;
    document.body.appendChild(el);
  }
});

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { AvatarProvider } from './contexts/AvatarContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AvatarProvider>
      <App />
    </AvatarProvider>
  </StrictMode>,
);
