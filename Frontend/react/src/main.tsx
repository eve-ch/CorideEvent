import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './OrganizerPage.css';
import RegisterPage from './RegisterPage';
import PersonalEventPage from './PersonalEventPage';
import MyEventsPage from './MyEventsPage';
import OrganizerPage from "./OrganizerPage";
import AdminLoginPage from './AdminLoginPage';

const pathname = window.location.pathname;

const eventPath = pathname.match(/^\/event\/([^/]+)\/?$/);
const accessPath = pathname.match(/^\/access\/([^/]+)\/?$/);
const myEventsPath = pathname.match(/^\/access\/([^/]+)\/events\/?$/);
const personalEventPath = pathname.match(/^\/access\/([^/]+)\/events\/([^/]+)\/?$/);

const page = personalEventPath ? (
    <PersonalEventPage
        token={personalEventPath[1]}
        eventId={personalEventPath[2]}
    />
) : myEventsPath ? (
    <MyEventsPage token={myEventsPath[1]} />
) : accessPath ? (
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