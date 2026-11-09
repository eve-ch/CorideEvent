import { useEffect, useState } from 'react';

type PersonalEventData = {
    firstName: string;
    event: {
        name: string;
        description: string | null;
        event_location: string;
        starts_at: string;
        application_deadline: string;
    };
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('sv-SE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function PersonalEventPage({
                                              token,
                                          }: {
    token: string;
}) {
    const [data, setData] = useState<PersonalEventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        async function loadPage() {
            setLoading(true);
            setError('');
            setData(null);

            try {
                const response = await fetch(
                    `/api/events/access/${encodeURIComponent(token)}`,
                    {
                        signal: controller.signal,
                        cache: 'no-store',
                    }
                );

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Den personliga länken är ogiltig.');
                    }

                    if (response.status === 410) {
                        throw new Error(
                            'Den personliga länken gäller inte längre.'
                        );
                    }

                    throw new Error('Kunde inte hämta din eventsida.');
                }

                const result: PersonalEventData = await response.json();

                if (!controller.signal.aborted) {
                    setData(result);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Kunde inte öppna sidan.'
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadPage();

        return () => controller.abort();
    }, [token]);

    return (
        <div className="app">
            <header>
                <div className="logo">
                    CO<span>R</span>IDE
                </div>
                <span className="organizer-label">Eventdeltagare</span>
            </header>

            <div className="page-title">
                <h1>Min eventsida</h1>
            </div>

            <main>
                {loading && <p role="status">Hämtar din eventsida...</p>}

                {error && (
                    <p className="error" role="alert">{error}</p>
                )}

                {!loading && !error && data && (
                    <article className="event-card">
                        <h2>Hej {data.firstName}!</h2>

                        <h3>{data.event.name}</h3>

                        <p className="event-description">
                            {data.event.description ||
                                'Ingen beskrivning angiven.'}
                        </p>

                        <p>Plats: {data.event.event_location}</p>
                        <p>
                            Start: {formatDate(data.event.starts_at)}
                        </p>
                        <p>
                            Sista anmälan:{' '}
                            {formatDate(data.event.application_deadline)}
                        </p>

                        <p className="notice">
                            Din personliga länk fungerar. Val av
                            samåkningsalternativ kopplas in senare.
                        </p>
                    </article>
                )}
            </main>
        </div>
    );
}