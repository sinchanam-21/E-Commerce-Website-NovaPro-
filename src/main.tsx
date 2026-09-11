import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CurrencyProvider } from './context/CurrencyContext.tsx';
import { OwnerProvider } from './context/OwnerContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <OwnerProvider>
        <App />
      </OwnerProvider>
    </CurrencyProvider>
  </StrictMode>,
);
