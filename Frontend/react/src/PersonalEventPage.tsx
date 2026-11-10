import { useEffect, useState } from 'react';
import ParticipantForm from './ParticipantForm';
import type { TravelOptionData } from './ParticipantForm';
import ParticipantPage from './ParticipantPage';

type RegistrationData = {
    id: string;
    role: string;
    offered_seats: number | null;
    status: string;
    travel_option: {
        place_name: string;
        departure_time: string;
        direction: string;
    };
};

type PersonalEventData = {
    firstName: string;
    event: {
        name: string;
        description: string | null;
        event_location: string;
        starts_at: string;
        application_deadline: string;
        travel_options: TravelOptionData[];
    };
    registrations: RegistrationData[];
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('sv-SE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function PersonalEventPage({ token }: { token: string }) {
    const [data, setData] = useState<PersonalEventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [registrationMessage, setRegistrationMessage] = useState('');
    const [reload, setReload] = useState(0);

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
    }, [token, reload]);

    const outboundRegistrations = data?.registrations.filter(
        registration => registration.travel_option.direction === 'TO_EVENT'
    ) ?? [];

    return (
            <ParticipantPage
                firstName={!loading && !error && data ? data.firstName : undefined}
                event={!loading && !error && data ? data.event : undefined}
            >
                {registrationMessage && (
                    <p role="status">{registrationMessage}</p>
                )}

                {loading && <p role="status">Hämtar din eventsida...</p>}

                {error && (
                    <div>
                        <p className="error" role="alert">{error}</p>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setReload(value => value + 1)}
                        >
                            Försök hämta sidan igen
                        </button>
                    </div>
                )}

                {!loading && !error && data && (
                    <>

                        {outboundRegistrations.length > 0 ? (
                            <article className="event-card detail-card">
                                <h2>Din samåkningsanmälan</h2>

                                {outboundRegistrations.map(registration => (
                                    <dl key={registration.id}>
                                        <dt>Roll</dt>
                                        <dd>
                                            {registration.role === 'DRIVER'
                                                ? 'Förare'
                                                : 'Passagerare'}
                                        </dd>

                                        <dt>Avreseplats</dt>
                                        <dd>
                                            {registration.travel_option.place_name}
                                        </dd>

                                        <dt>Avresetid</dt>
                                        <dd>
                                            {formatDate(
                                                registration.travel_option
                                                    .departure_time
                                            )}
                                        </dd>

                                        {registration.role === 'DRIVER' && (
                                            <>
                                                <dt>Erbjudna platser</dt>
                                                <dd>
                                                    {registration.offered_seats}
                                                </dd>
                                            </>
                                        )}

                                        <dt>Status</dt>
                                        <dd>
                                            {registration.status === 'REGISTERED'
                                                ? 'Registrerad'
                                                : registration.status}
                                        </dd>
                                    </dl>
                                ))}
                            </article>
                        ) : (
                            <article className="event-card">
                                <h2>Anmäl dig till samåkning</h2>

                                <ParticipantForm
                                    token={token}
                                    travelOptions={data.event.travel_options}
                                    onCreated={() => {
                                        setRegistrationMessage(
                                            'Din samåkningsanmälan har sparats.'
                                        );
                                        setReload(value => value + 1);
                                    }}
                                    onCancel={() => {
                                        setRegistrationMessage('');
                                    }}
                                />
                            </article>
                        )}
                    </>
                )}
            </ParticipantPage>
    );
}