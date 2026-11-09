import ParticipantForm from './ParticipantForm';

function ParticipantPage() {
    return (
        <div className="app">
            <header>
                <div className="logo">
                    CO<span>R</span>IDE
                </div>

                <span className="organizer-label">
                    Deltagare
                </span>
            </header>

            <main>
                <h1>Anmäl till event</h1>

                <article className="event-card detail-card">
                    <h2>Sigtuna Folkbildningsgala</h2>

                    <p>
                        Välkommen till årets gala.
                    </p>

                    <dl>
                        <dt>Plats</dt>
                        <dd>Sigtuna folkhögskola</dd>

                        <dt>Datum</dt>
                        <dd>15 oktober 2026 kl 18:00</dd>

                        <dt>Sista anmälan</dt>
                        <dd>10 oktober 2026</dd>
                    </dl>
                </article>

                <article className="event-card">
                    <ParticipantForm
                        onCreated={() =>
                            alert('Anmälan sparad!')
                        }
                        onCancel={() => {}}
                    />
                </article>
            </main>
        </div>
    );
}

export default ParticipantPage;