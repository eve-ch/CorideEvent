import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './OrganizerPage.css';
import RegisterPage from './RegisterPage';
import PersonalEventPage from './PersonalEventPage';
import OrganizerPage from "./OrganizerPage.tsx";
import AdminLoginPage from './AdminLoginPage';

const pathname = window.location.pathname;

const eventPath = pathname.match(/^\/event\/([^/]+)\/?$/);
const accessPath = pathname.match(/^\/access\/([^/]+)\/?$/);

const page = accessPath ? (
    <PersonalEventPage token={accessPath[1]} />
) : eventPath ? (
    <RegisterPage key={eventPath[1]} shareToken={eventPath[1]} />
) : pathname === '/admin' ? (
    <OrganizerPage />
) : pathname === '/' ? (
    <AdminLoginPage />
) : (
    <main>
        <h1>Sidan hittades inte</h1>
    </main>
);

createRoot(document.getElementById('root')!).render(
    <StrictMode>{page}</StrictMode>
);