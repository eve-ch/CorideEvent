//import ParticipantForm from './ParticipantForm';
import type { ReactNode } from 'react';

type ParticipantPageProps = {
    token: string;
    showMyEvents: boolean;
    firstName?: string;
    event?: {
        name: string;
        description: string | null;
        event_location: string;
        starts_at: string;
        application_deadline: string;
    };
    children: ReactNode;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('sv-SE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function ParticipantPage({token, showMyEvents, firstName, event, children,}: ParticipantPageProps) {
    return (
        <div className="app">
            <header className="participant-page-header">
                <div className="logo">
                    CO<span>R</span>IDE
                </div>

                {showMyEvents && (
                    <button
                        type="button"
                        className="my-events-title"
                        onClick={() => {
                            window.location.href =
                                `/access/${encodeURIComponent(token)}/events`;
                        }}
                    >
                        Mina event
                    </button>
                )}

                <span className="organizer-label">
                    Deltagare
                </span>
            </header>

            <main>
                <h1>Anmäl till event</h1>
                {firstName && <h2>Hej {firstName}!</h2>}

                {event && (

                <article className="event-card detail-card">
                    <h2>{event.name}</h2>

                    <p className="event-description">
                        {event.description || 'Ingen beskrivning angiven.'}
                    </p>

                    <dl>
                        <dt>Plats</dt>
                        <dd>{event.event_location}</dd>

                        <dt>Datum</dt>
                        <dd>{formatDate(event.starts_at)}</dd>

                        <dt>Sista anmälan</dt>
                        <dd>{formatDate(event.application_deadline)}</dd>
                    </dl>
                </article>
                )}

                {children}
            </main>
        </div>
    );
}

export default ParticipantPage;