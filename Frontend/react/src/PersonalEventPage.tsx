import {useEffect, useState} from 'react';
import ParticipantForm from './ParticipantForm';
import type {TravelOptionData} from './ParticipantForm';
import ParticipantPage from './ParticipantPage';

type RegistrationData = {
    id: string;
    role: string;
    offered_seats: number | null;
    status: string;
    travel_option: {
        id: string;
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

export default function PersonalEventPage({token,eventId}: {
    token: string;
    eventId?: string;
}) {
    const [data, setData] = useState<PersonalEventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [registrationMessage, setRegistrationMessage] = useState('');
    const [reload, setReload] = useState(0);
    const [editingRegistration, setEditingRegistration] =
        useState<{
            outbound: RegistrationData;
            returnRegistration?: RegistrationData;
        } | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadPage() {
            setLoading(true);
            setError('');
            setData(null);

            try {
                const url = eventId
                    ? `/api/events/access/${encodeURIComponent(token)}/events/${eventId}`
                    : `/api/events/access/${encodeURIComponent(token)}`;

                const response = await fetch(url, {
                    signal: controller.signal,
                    cache: 'no-store',
                });

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
    }, [token, eventId, reload]);

    const outboundRegistrations = data?.registrations.filter(
        registration => registration.travel_option.direction === 'TO_EVENT'
    ) ?? [];

    const returnRegistrations =
        data?.registrations.filter(
            registration =>
                registration.travel_option.direction === 'FROM_EVENT'
        ) ?? [];

    return (
        <ParticipantPage
            token={token}
            firstName={!loading && !error && data ? data.firstName : undefined}
            event={!loading && !error && data ? data.event : undefined}
        >

            {eventId && (
                <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                        window.location.href =
                            `/access/${encodeURIComponent(token)}/events`;
                    }}
                >
                    Tillbaka till Mina event
                </button>
            )}

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
                {editingRegistration ? (
                    <article className="event-card">
                        <h2>Redigera anmälan</h2>

                        <ParticipantForm
                            token={token}
                            eventId={eventId}
                            registrationId={editingRegistration.outbound.id}
                            initialRole={editingRegistration.outbound.role}
                            initialTravelOptionId={
                                editingRegistration.outbound.travel_option.id
                            }
                            initialOfferedSeats={
                                editingRegistration.outbound.offered_seats
                            }
                            initialWantsReturnTrip={
                                !!editingRegistration.returnRegistration
                            }
                            initialReturnOfferedSeats={
                                editingRegistration.returnRegistration
                                    ?.offered_seats ?? null
                            }

                            travelOptions={data.event.travel_options}
                            onCreated={() => {
                                setEditingRegistration(null);
                                setRegistrationMessage(
                                    'Anmälan har uppdaterats.'
                                );
                                setReload(v => v + 1);
                            }}
                            onCancel={() => {
                                setEditingRegistration(null);
                            }}
                        />
                    </article>
                ) : outboundRegistrations.length > 0 ? (
                        <article className="event-card detail-card">
                            <h2>Din samåkningsanmälan</h2>

                            <h3>Till eventet</h3>
                            {outboundRegistrations.map(registration => (
                                <div key={registration.id}>

                                    <dl>
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

                                        <h3>Hem från eventet</h3>
                                        <dt>Roll</dt>
                                        <dd>
                                            {registration.role === 'DRIVER'
                                                ? 'Förare'
                                                : 'Passagerare'}
                                        </dd>

                                        {(() => {
                                            const returnRegistration = returnRegistrations.find(
                                                r =>
                                                    r.travel_option.place_name ===
                                                    registration.travel_option.place_name
                                            );

                                            if (!returnRegistration) {
                                                return (
                                                    <>
                                                        <dt>Hemresa</dt>
                                                        <dd>Ingen hemresa registrerad</dd>
                                                    </>
                                                );
                                            }

                                            if (returnRegistration.role === 'DRIVER') {
                                                return (
                                                    <>
                                                        <dt>Erbjudna platser</dt>
                                                        <dd>
                                                            {returnRegistration.offered_seats}
                                                        </dd>
                                                    </>
                                                );
                                            }

                                            return null;
                                        })()}

                                        <dt>Status</dt>
                                        <dd>
                                            {registration.status === 'REGISTERED'
                                                ? 'Registrerad'
                                                : registration.status}
                                        </dd>
                                    </dl>

                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            marginTop: '1rem'
                                        }}
                                    >
                                        <button
                                            className="secondary-button"
                                            onClick={() => {

                                                const returnRegistration =
                                                    returnRegistrations.find(
                                                        r =>
                                                            r.travel_option.place_name ===
                                                            registration.travel_option.place_name
                                                    );

                                                setEditingRegistration({
                                                    outbound: registration,
                                                    returnRegistration,
                                                });
                                            }}
                                        >
                                            Redigera
                                        </button>

                                        <button
                                            className="secondary-button"
                                            onClick={async () => {

                                                if (
                                                    !confirm(
                                                        'Är du säker på att du vill ta bort din anmälan?'
                                                    )
                                                ) {
                                                    return;
                                                }

                                                try {

                                                    const response =
                                                        await fetch(
                                                            `/api/events/access/${encodeURIComponent(
                                                                token
                                                            )}/registrations/${registration.id}`,
                                                            {
                                                                method: 'DELETE',
                                                            }
                                                        );

                                                    const data =
                                                        await response.json();

                                                    if (!response.ok) {

                                                        alert(
                                                            data.message ??
                                                            'Kunde inte ta bort anmälan.'
                                                        );

                                                        return;
                                                    }

                                                    setRegistrationMessage(
                                                        'Anmälan har tagits bort.'
                                                    );

                                                    setReload(
                                                        value => value + 1
                                                    );

                                                } catch {

                                                    alert(
                                                        'Kunde inte ta bort anmälan.'
                                                    );
                                                }
                                            }}
                                        >
                                            Ta bort
                                        </button>

                                    </div>

                                </div>
                            ))}

                        </article>
                    ) : (
                        <article className="event-card">
                            <h2>Anmäl dig till samåkning</h2>

                            <ParticipantForm
                                token={token}
                                eventId={eventId}
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