import { useEffect, useState } from 'react';

type EventSummary = {
    id: string;
    name: string;
    starts_at: string;
    event_location: string;
};

type EventsResponse = {
    firstName: string;
    events: EventSummary[];
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('sv-SE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function MyEventsPage({
                                         token,
                                     }: {
    token: string;
}) {
    const [data, setData] =
        useState<EventsResponse | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    useEffect(() => {
        const controller =
            new AbortController();

        async function loadEvents() {
            try {
                setLoading(true);
                setError('');

                const response =
                    await fetch(
                        `/api/events/access/${encodeURIComponent(
                            token
                        )}/events`,
                        {
                            signal:
                            controller.signal,
                            cache: 'no-store',
                        }
                    );

                if (!response.ok) {

                    if (
                        response.status === 404
                    ) {
                        throw new Error(
                            'Den personliga länken är ogiltig.'
                        );
                    }

                    if (
                        response.status === 410
                    ) {
                        throw new Error(
                            'Den personliga länken gäller inte längre.'
                        );
                    }

                    throw new Error(
                        'Kunde inte hämta dina event.'
                    );
                }

                const result:
                    EventsResponse =
                    await response.json();

                if (
                    !controller.signal.aborted
                ) {
                    setData(result);
                }

            } catch (error) {

                if (
                    !controller.signal.aborted
                ) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Kunde inte hämta dina event.'
                    );
                }

            } finally {

                if (
                    !controller.signal.aborted
                ) {
                    setLoading(false);
                }
            }
        }

        loadEvents();

        return () =>
            controller.abort();

    }, [token]);

    if (loading) {
        return (
            <p>Hämtar dina event...</p>
        );
    }

    if (error) {
        return (
            <p className="error">
                {error}
            </p>
        );
    }

    return (
        <div className="app">
            <header className="my-events-header">
                <div className="logo">
                    CO<span>R</span>IDE
                </div>

                <h1 className="my-events-page-title">Mina event</h1>
            </header>

            <main>
                {data?.firstName && <h2>Hej {data.firstName}!</h2>}

                {data?.events.length === 0 ? (
                    <p>Du har inga registrerade event.</p>
                ) : (
                    data?.events.map(event => (
                        <article key={event.id} className="event-card">
                            <h2>{event.name}</h2>
                            <p>{event.event_location}</p>
                            <p>{formatDate(event.starts_at)}</p>

                            <button
                                className="secondary-button"
                                onClick={() => {
                                    window.location.href =
                                        `/access/${encodeURIComponent(token)}/events/${event.id}`;
                                }}
                            >
                                Visa event
                            </button>
                        </article>
                    ))
                )}
            </main>
        </div>
    );
}