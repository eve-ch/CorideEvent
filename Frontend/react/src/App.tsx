import { useEffect, useState } from 'react';
import './App.css';
import EventForm from './EventForm';

type EventData = {
  id: string;
  name: string;
  description: string | null;
  event_location: string;
  starts_at: string;
  application_deadline: string;
  matching_status: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function App() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [reload, setReload] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {

      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/events', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Kunde inte hämta event.');
        }

        const data: EventData[] = await response.json();

        if (!controller.signal.aborted) {
          setEvents(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Kunde inte hämta event. Kontrollera servern.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => controller.abort();
  }, [reload]);

  return (
      <div className="app">
        <header>
          <div className="logo">
            CO<span>R</span>IDE
          </div>
          <span className="organizer-label">Arrangör</span>
        </header>

        <div className="page-title">
          <h1>
            {showForm
                ? 'Skapa event'
                : selectedEvent
                    ? 'Eventinformation'
                    : 'Admin – Mina event'}
          </h1>
        </div>

        <main>
          <p className="notice">
            Lokal testversion: event tillhör testarrangören.
          </p>

          {selectedEvent ? (
              <>
                <button
                    className="secondary-button"
                    onClick={() => setSelectedEvent(null)}
                >
                  ← Mina event
                </button>

                <article className="event-card detail-card">
                  <h2>{selectedEvent.name}</h2>

                  <p className="event-description">
                    {selectedEvent.description || 'Ingen beskrivning angiven.'}
                  </p>

                  <dl>
                    <dt>Plats</dt>
                    <dd>{selectedEvent.event_location}</dd>

                    <dt>Start</dt>
                    <dd>{formatDate(selectedEvent.starts_at)}</dd>

                    <dt>Sista anmälan</dt>
                    <dd>{formatDate(selectedEvent.application_deadline)}</dd>

                    <dt>Matchning</dt>
                    <dd>
                      {selectedEvent.matching_status === 'NOT_STARTED'
                          ? 'Inte påbörjad'
                          : selectedEvent.matching_status}
                    </dd>
                  </dl>
                </article>
              </>
          ) : showForm ? (
              <EventForm
                  onCreated={() => {
                    setShowForm(false);
                    setMessage('Eventet har sparats i databasen.');
                    setReload(value => value + 1);
                  }}
                  onCancel={() => {
                    setShowForm(false);
                    setReload(value => value + 1);
                  }}
              />
          ) : (
              <>
                <button
                    className="primary-button"
                    onClick={() => {
                      setMessage('');
                      setShowForm(true);
                    }}
                >
                  + Skapa nytt event
                </button>

                {message && <p role="status">{message}</p>}

                <h2 className="section-label">SKAPADE EVENT</h2>

                {loading && <p role="status">Hämtar event...</p>}

                {error && (
                    <div>
                      <p className="error" role="alert">{error}</p>
                      <button
                          className="secondary-button"
                          onClick={() => setReload(value => value + 1)}
                      >
                        Försök igen
                      </button>
                    </div>
                )}

                {!loading && !error && events.length === 0 && (
                    <p>Inga event ännu.</p>
                )}

                {!loading && !error && events.map(event => (
                    <article className="event-card" key={event.id}>
                      <h2>{event.name}</h2>

                      <p>Datum: {formatDate(event.starts_at)}</p>
                      <p>Plats: {event.event_location}</p>

                      <span className="badge">
            {now <= Date.parse(event.application_deadline)
                ? 'Anmälan öppen'
                : 'Anmälan stängd'}
        </span>

                      <p className="deadline">
                        Sista anmälan:{' '}
                        {formatDate(event.application_deadline)}
                      </p>

                      <button
                          className="secondary-button"
                          onClick={() => {
                            setMessage('');
                            setSelectedEvent(event);
                          }}
                      >
                        Visa event →
                      </button>
                    </article>
                ))}
              </>
          )}
        </main>
      </div>
  );
}

export default App;