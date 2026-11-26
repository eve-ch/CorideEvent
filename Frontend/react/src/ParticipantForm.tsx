import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

export type TravelOptionData = {
    id: string;
    place_name: string;
    departure_time: string;
    direction: string;
};

type ParticipantFormProps = {
    token: string;
    travelOptions: TravelOptionData[];
    onCreated: () => void;
    onCancel: () => void;

    registrationId?: string;
    initialRole?: string;
    initialTravelOptionId?: string;
    initialOfferedSeats?: number | null;
};

function ParticipantForm({
                             token,
                             travelOptions,
                             onCreated,
                             onCancel,
                             registrationId,
                             initialRole,
                             initialTravelOptionId,
                             initialOfferedSeats,
                         }: ParticipantFormProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [role, setRole] = useState(initialRole ?? 'PASSENGER');
    const [wantsReturnTrip, setWantsReturnTrip] = useState(false);
    const [returnRole, setReturnRole] = useState('PASSENGER');
    const [returnOfferedSeats, setReturnOfferedSeats] = useState(1);

    const submitting = useRef(false);

    async function handleSubmit(
        e: FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        if (submitting.current) return;

        setError('');

        const form = new FormData(e.currentTarget);



        const travelOption = String(
            form.get('travelOption') ?? ''
        );

        const offeredSeats =
            role === 'DRIVER'
                ? Number(form.get('offeredSeats'))
                : null;

        if (!travelOption) {
            setError('Välj en startplats.');
            return;
        }

        if (
            role === 'DRIVER' &&
            (
                offeredSeats === null ||
                !Number.isInteger(offeredSeats) ||
                offeredSeats < 1 ||
                offeredSeats > 15
            )
        ) {
            setError('Antal platser måste vara mellan 1 och 15.');
            return;
        }

        submitting.current = true;
        setSaving(true);

        try {
            const response = await fetch(
                registrationId
                    ? `/api/events/access/${encodeURIComponent(token)}/registrations/${registrationId}`
                    : `/api/events/access/${encodeURIComponent(token)}/registrations`,
                {
                    method: registrationId ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        travelOptionId: travelOption,
                        role,
                        offeredSeats,

                        wantsReturnTrip,

                        returnRole:
                            wantsReturnTrip
                                ? returnRole
                                : null,

                        returnOfferedSeats:
                            wantsReturnTrip &&
                            returnRole === 'DRIVER'
                                ? returnOfferedSeats
                                : null,
                    }),
                }
            );

            if (!response.ok) {
                const data =
                    await response.json();

                setError(
                    data.message ??
                    'Kunde inte spara deltagaren.'
                );

                return;
            }

            onCreated();
        } catch {
            setError(
                'Kunde inte spara anmälan.'
            );
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    }

    return (
        <form
            className="event-form"
            onSubmit={handleSubmit}
        >

            <h2>Reseinformation</h2>

            <div>
                <label>
                    Jag reser som *
                </label>

                <div className="role-selector">
                    <button
                        type="button"
                        className={
                            role === 'PASSENGER'
                                ? 'role-card selected'
                                : 'role-card'
                        }
                        onClick={() =>
                            setRole('PASSENGER')
                        }
                    >
                        Passagerare
                    </button>

                    <button
                        type="button"
                        className={
                            role === 'DRIVER'
                                ? 'role-card selected'
                                : 'role-card'
                        }
                        onClick={() =>
                            setRole('DRIVER')
                        }
                    >
                        Förare
                    </button>
                </div>
            </div>

            <div className="travel-card">
                <label htmlFor="travelOption">
                    Startplats *
                </label>

                <select
                    id="travelOption"
                    name="travelOption"
                    required
                    defaultValue={initialTravelOptionId}
                >
                    <option value="">
                        Välj startplats
                    </option>

                    {travelOptions
                        .filter(option => option.direction === 'TO_EVENT')
                        .map(option => (
                            <option key={option.id} value={option.id}>
                                {option.place_name} –{' '}
                                {new Intl.DateTimeFormat('sv-SE', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                }).format(new Date(option.departure_time))}
                            </option>
                        ))}
                </select>
            </div>

            <h3>Hemresa</h3>

            <div>
                <label>
                    Jag vill samåka hem efter eventet *
                </label>

                <div className="role-selector">
                    <button
                        type="button"
                        className={
                            wantsReturnTrip
                                ? 'role-card selected'
                                : 'role-card'
                        }
                        onClick={() => setWantsReturnTrip(true)}
                    >
                        Ja
                    </button>

                    <button
                        type="button"
                        className={
                            !wantsReturnTrip
                                ? 'role-card selected'
                                : 'role-card'
                        }
                        onClick={() => setWantsReturnTrip(false)}
                    >
                        Nej
                    </button>
                </div>
            </div>

            {wantsReturnTrip && (
                <div>
                    <label>
                        Jag reser hem som *
                    </label>

                    <div className="role-selector">
                        <button
                            type="button"
                            className={
                                returnRole === 'PASSENGER'
                                    ? 'role-card selected'
                                    : 'role-card'
                            }
                            onClick={() =>
                                setReturnRole('PASSENGER')
                            }
                        >
                            Passagerare
                        </button>

                        <button
                            type="button"
                            className={
                                returnRole === 'DRIVER'
                                    ? 'role-card selected'
                                    : 'role-card'
                            }
                            onClick={() =>
                                setReturnRole('DRIVER')
                            }
                        >
                            Förare
                        </button>
                    </div>
                </div>
            )}

            {wantsReturnTrip &&
                returnRole === 'DRIVER' && (
                    <div>
                        <label htmlFor="returnOfferedSeats">
                            Antal passagerarplatser på hemresan *
                        </label>

                        <input
                            id="returnOfferedSeats"
                            type="number"
                            min="1"
                            max="15"
                            value={returnOfferedSeats}
                            onChange={(e) =>
                                setReturnOfferedSeats(
                                    Number(e.target.value)
                                )
                            }
                        />
                    </div>
                )}

            {role === 'DRIVER' && (
                <div>
                    <label htmlFor="offeredSeats">
                        Antal passagerarplatser i bilen *
                    </label>

                    <input
                        id="offeredSeats"
                        name="offeredSeats"
                        type="number"
                        min="1"
                        max="15"
                        defaultValue={initialOfferedSeats ?? 1}
                        required
                    />
                </div>
            )}

            <p className="notice">
                * Obligatoriska fält.
            </p>

            {error && (
                <p
                    className="error"
                    role="alert"
                >
                    {error}
                </p>
            )}

            <button
                className="primary-button"
                type="submit"
                disabled={saving}
            >
                {saving
                    ? 'Sparar...'
                    : registrationId
                        ? 'Spara ändringar'
                        : 'Anmäl mig'}
            </button>

            <button
                className="secondary-button"
                type="button"
                onClick={onCancel}
                disabled={saving}
            >
                Avbryt
            </button>
        </form>
    );
}

export default ParticipantForm;