import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

type PublicEvent = {
    name: string;
    description: string | null;
    event_location: string;
    starts_at: string;
    application_deadline: string;
};

type PublicEventPageProps = {
    shareToken: string;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('sv-SE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function PublicEventPage({
                                            shareToken,
                                        }: PublicEventPageProps) {
    const [event, setEvent] = useState<PublicEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [formMessage, setFormMessage] = useState('');

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

                const data: PublicEvent = await response.json();

                if (!controller.signal.aborted) {
                    setEvent(data);
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

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            setFormMessage('Fyll i förnamn, efternamn och mejladress.');
            return;
        }

        // Nästa steg: skicka uppgifterna till backend
        // och skapa den personliga åtkomstlänken.
        setFormMessage(
            'Formuläret är ännu inte kopplat till sparande eller mejlutskick. Inga uppgifter har skickats.'
        );
    }

    return (
        <div className="app">
            <header>
                <div className="logo">
                    CO<span>R</span>IDE
                </div>
                <span className="organizer-label">Eventdeltagare</span>
            </header>

            <div className="page-title">
                <h1>Samåkning till event</h1>
            </div>

            <main>
                {loading && <p role="status">Hämtar event...</p>}

                {error && (
                    <p className="error" role="alert">
                        {error}
                    </p>
                )}

                {!loading && !error && event && (
                    <>
                        <article className="event-card">
                            <h2>{event.name}</h2>

                            <p className="event-description">
                                {event.description ||
                                    'Ingen beskrivning angiven.'}
                            </p>

                            <p>Plats: {event.event_location}</p>
                            <p>Start: {formatDate(event.starts_at)}</p>
                            <p>
                                Sista anmälan:{' '}
                                {formatDate(event.application_deadline)}
                            </p>
                        </article>

                        <section className="event-card">
                            <h2>Få din personliga länk</h2>

                            <p>
                                Ange dina kontaktuppgifter. Via din
                                personliga länk kommer du att kunna
                                anmäla hur du vill samåka.
                            </p>

                            <p className="notice">
                                Testversion: sparande och mejlutskick
                                är ännu inte inkopplade.
                            </p>

                            <form
                                className="event-form"
                                onSubmit={handleSubmit}
                            >
                                <div>
                                    <label htmlFor="first-name">
                                        Förnamn *
                                    </label>
                                    <input
                                        id="first-name"
                                        name="firstName"
                                        autoComplete="given-name"
                                        value={firstName}
                                        onChange={e =>
                                            setFirstName(e.target.value)
                                        }
                                        required
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="last-name">
                                        Efternamn *
                                    </label>
                                    <input
                                        id="last-name"
                                        name="lastName"
                                        autoComplete="family-name"
                                        value={lastName}
                                        onChange={e =>
                                            setLastName(e.target.value)
                                        }
                                        required
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email">
                                        Mejladress *
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={e =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                        maxLength={254}
                                    />
                                </div>

                                {formMessage && (
                                    <p role="status">{formMessage}</p>
                                )}

                                <button
                                    className="primary-button"
                                    type="submit"
                                >
                                    Begär personlig länk
                                </button>
                            </form>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}