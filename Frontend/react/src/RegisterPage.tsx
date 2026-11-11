import { useEffect, useState } from 'react';
import ParticipantStartForm from './RegisterForm';

type PublicEvent = {
    name: string;
    description: string | null;
    event_location: string;
    starts_at: string;
    application_deadline: string;
};

type RegisterPageProps = {
    shareToken: string;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('sv-SE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function ParticipantStartPage({ shareToken} : RegisterPageProps) {
    const [event, setEvent] = useState<PublicEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [accessPath, setAccessPath] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        async function loadEvent() {
            setLoading(true);
            setError('');
            setEvent(null);

            try {
                const response = await fetch(
                    `/api/events/public/${encodeURIComponent(shareToken)}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error(
                        response.status === 404
                            ? 'Eventet hittades inte. Kontrollera länken.'
                            : 'Kunde inte hämta eventet. Försök igen senare.'
                    );
                }

                const result: PublicEvent = await response.json();

                if (!controller.signal.aborted) {
                    setEvent(result);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Kunde inte hämta eventet.'
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadEvent();

        return () => controller.abort();
    }, [shareToken]);


    return (
        <div className="app">
            <header>
                <div className="logo">
                    CO<span>R</span>IDE
                </div>

                <span className="organizer-label">
                    Registrering
                </span>
            </header>

            <main>
                <h1>Anmäl till event</h1>

                {loading && <p role="status">Hämtar event...</p>}

                {error && (
                    <p className="error" role="alert">{error}</p>
                )}

                {!loading && !error && event && (
                    <>
                        <article className="event-card detail-card">
                            <h2>{event.name}</h2>

                            <p className="event-description">
                                {event.description ||
                                    'Ingen beskrivning angiven.'}
                            </p>

                            <dl>
                                <dt>Plats</dt>
                                <dd>{event.event_location}</dd>

                                <dt>Start</dt>
                                <dd>{formatDate(event.starts_at)}</dd>

                                <dt>Sista anmälan</dt>
                                <dd>
                                    {formatDate(event.application_deadline)}
                                </dd>
                            </dl>
                        </article>

                        <section className="event-card">
                            <h2>Få din personliga länk</h2>

                            <p className="notice">
                                Testversion: Inget mejl skickas.
                                Kopiera och spara din personliga länk.
                                Alla som har länken kan öppna din eventsida.
                            </p>

                            {accessPath ? (
                                <>
                                    <p role="status">
                                        Din personliga testlänk har skapats.
                                    </p>

                                    <a href={accessPath}>
                                        Öppna min personliga eventsida →
                                    </a>
                                </>
                            ) : (
                                <ParticipantStartForm
                                    eventName={event.name}
                                    shareToken={shareToken}
                                    onCreated={setAccessPath}
                                />
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default ParticipantStartPage;