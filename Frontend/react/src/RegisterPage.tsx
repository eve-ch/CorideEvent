import ParticipantStartForm from './RegisterForm';

function ParticipantStartPage() {
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

                <ParticipantStartForm
                    eventName="IKEA Älmhult Konferens"
                    onCreated={() =>
                        alert(
                            'Länk skickad till e-postadressen'
                        )
                    }
                />
            </main>
        </div>
    );
}

export default ParticipantStartPage;