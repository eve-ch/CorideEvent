import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './App.css';
import App from './App';
import PublicEventPage from './PublicEventPage';
import PersonalEventPage from './PersonalEventPage';

const pathname = window.location.pathname;

const eventPath = pathname.match(/^\/event\/([^/]+)\/?$/);
const accessPath = pathname.match(/^\/access\/([^/]+)\/?$/);

const page = accessPath ? (
    <PersonalEventPage token={accessPath[1]} />
) : eventPath ? (
    <PublicEventPage shareToken={eventPath[1]} />
) : pathname === '/' ? (
    <App />
) : (
    <main>
        <h1>Sidan hittades inte</h1>
    </main>
);

createRoot(document.getElementById('root')!).render(
    <StrictMode>{page}</StrictMode>
);