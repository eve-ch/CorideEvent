import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

type EventFormProps = {
    onCreated: () => void;
    onCancel: () => void;
};

function EventForm({ onCreated, onCancel }: EventFormProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const submitting = useRef(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (submitting.current) return;

        setError('');

        const form = new FormData(e.currentTarget);
        const name = String(form.get('name') ?? '').trim();
        const location = String(form.get('eventLocation') ?? '').trim();
        const starts = new Date(String(form.get('startsAt')));
        const deadline = new Date(
            String(form.get('applicationDeadline'))
        );

        if (!name || !location) {
            setError('Ange eventnamn och plats.');
            return;
        }

        if (
            !Number.isFinite(starts.getTime()) ||
            !Number.isFinite(deadline.getTime())
        ) {
            setError('Ange giltiga datum och tider.');
            return;
        }

        if (starts <= new Date() || deadline > starts) {
            setError(
                'Starten måste vara i framtiden och sista anmälan senast vid starten.'
            );
            return;
        }

        submitting.current = true;
        setSaving(true);

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    eventLocation: location,
                    description: String(
                        form.get('description') ?? ''
                    ).trim(),
                    startsAt: starts.toISOString(),
                    applicationDeadline: deadline.toISOString(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || 'Kunde inte spara event.');
                return;
            }

            onCreated();
        } catch {
            setError(
                'Kunde inte bekräfta sparandet. Kontrollera eventlistan innan du försöker igen.'
            );
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    }

    return (
        <form className="event-form" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="name">Eventnamn *</label>
                <input
                    id="name"
                    name="name"
                    required
                    maxLength={200}
                    placeholder="T.ex. Sigtuna Folkbildningsgala"
                />
            </div>

            <div>
                <label htmlFor="location">Plats *</label>
                <input
                    id="location"
                    name="eventLocation"
                    required
                    maxLength={300}
                    placeholder="Adress eller platsnamn"
                />
            </div>

            <div>
                <label htmlFor="starts">Startdatum och tid *</label>
                <input
                    id="starts"
                    name="startsAt"
                    type="datetime-local"
                    required
                />
            </div>

            <div>
                <label htmlFor="deadline">
                    Sista anmälningsdag och tid *
                </label>
                <input
                    id="deadline"
                    name="applicationDeadline"
                    type="datetime-local"
                    required
                />
            </div>

            <div>
                <label htmlFor="description">Beskrivning</label>
                <textarea
                    id="description"
                    name="description"
                    maxLength={5000}
                    placeholder="Beskriv eventet kort"
                />
            </div>

            <p className="notice">
                * Obligatoriska fält. Tider anges i din lokala tidszon.
            </p>

            {error && <p className="error" role="alert">{error}</p>}

            <button
                className="primary-button"
                type="submit"
                disabled={saving}
            >
                {saving ? 'Sparar...' : 'Skapa event'}
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

export default EventForm;