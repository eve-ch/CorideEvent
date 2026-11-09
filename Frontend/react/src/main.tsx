import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './App.css';
import App from './App';
import PublicEventPage from './PublicEventPage';

const eventPath = window.location.pathname.match(
    /^\/event\/([^/]+)\/?$/
);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {eventPath ? (
            <PublicEventPage
                shareToken={eventPath[1]}
            />
        ) : (
            <App />
        )}
    </StrictMode>
);