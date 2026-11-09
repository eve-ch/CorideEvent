import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

type ParticipantStartFormProps = {
    eventName: string;
    onCreated: () => void;
};

function ParticipantStartForm({
                                  eventName,
                                  onCreated,
                              }: ParticipantStartFormProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

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

        if (
            !firstName ||
            !lastName ||
            !email
        ) {
            setError(
                'Fyll i förnamn, efternamn och e-post.'
            );
            return;
        }

        submitting.current = true;
        setSaving(true);

        try {
            const response = await fetch(
                '/api/participants/start',
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
                    }),
                }
            );

            if (!response.ok) {
                const data =
                    await response.json();

                setError(
                    data.message ??
                    'Kunde inte spara uppgifterna.'
                );

                return;
            }

            onCreated();
        } catch {
            setError(
                'Kunde inte skicka uppgifterna.'
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
            <h2>{eventName}</h2>

            <p>
                Ange dina uppgifter för att
                fortsätta anmälan.
            </p>

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
                    ? 'Skickar...'
                    : 'Fortsätt'}
            </button>
        </form>
    );
}

export default ParticipantStartForm;