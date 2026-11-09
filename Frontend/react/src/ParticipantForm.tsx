import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

type ParticipantFormProps = {
    onCreated: () => void;
    onCancel: () => void;
};

function ParticipantForm({
                             onCreated,
                             onCancel,
                         }: ParticipantFormProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [role, setRole] = useState('PASSENGER');

    const submitting = useRef(false);

    async function handleSubmit(
        e: FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        if (submitting.current) return;

        setError('');

        const form = new FormData(e.currentTarget);

        const firstName = String(
            form.get('firstName') ?? ''
        ).trim();

        const lastName = String(
            form.get('lastName') ?? ''
        ).trim();

        const email = String(
            form.get('email') ?? ''
        ).trim();

        const travelOption = String(
            form.get('travelOption') ?? ''
        );

        const offeredSeats =
            role === 'DRIVER'
                ? Number(form.get('offeredSeats'))
                : null;

        if (!firstName || !lastName || !email) {
            setError(
                'Ange förnamn, efternamn och e-post.'
            );
            return;
        }

        if (!travelOption) {
            setError('Välj en startplats.');
            return;
        }

        if (
            role === 'DRIVER' &&
            (
                !offeredSeats ||
                offeredSeats < 1 ||
                offeredSeats > 15
            )
        ) {
            setError(
                'Antal platser måste vara mellan 1 och 15.'
            );
            return;
        }

        submitting.current = true;
        setSaving(true);

        try {
            const response = await fetch(
                '/api/participants',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        role,
                        travelOption,
                        offeredSeats,
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
            <h2>Deltagarinformation</h2>

            <div>
                <label htmlFor="firstName">
                    Förnamn *
                </label>

                <input
                    id="firstName"
                    name="firstName"
                    required
                    maxLength={100}
                />
            </div>

            <div>
                <label htmlFor="lastName">
                    Efternamn *
                </label>

                <input
                    id="lastName"
                    name="lastName"
                    required
                    maxLength={100}
                />
            </div>

            <div>
                <label htmlFor="email">
                    E-post *
                </label>

                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={255}
                />
            </div>

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
                >
                    <option value="">
                        Välj startplats
                    </option>

                    <option value="lund">
                        Lund C
                    </option>

                    <option value="malmo">
                        Malmö C
                    </option>

                    <option value="helsingborg">
                        Helsingborg C
                    </option>
                </select>
            </div>

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
                        defaultValue="1"
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