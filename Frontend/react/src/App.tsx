import './App.css';

import EventPage from './EventPage';
import RegisterPage from './RegisterPage';
import ParticipantPage from './ParticipantPage';

// 0 = Arrangör
// 1 = Registrering
// 2 = Eventdeltagare

const PAGE_MODE: 0 | 1 | 2 = 2;

function App() {
    switch (PAGE_MODE) {
        case 1:
            return <RegisterPage/>;

        case 2:
            return <ParticipantPage/>;

        default:
            return <EventPage/>;
    }
}

export default App;