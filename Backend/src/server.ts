import express from 'express';
import path from 'node:path';
import { eventRoutes } from './routes/eventRoutes';
import {participantRoutes} from "./routes/participantRoutes";

const app = express();
const port = 3000;

app.use(express.json());

// Backend för att hämta och skapa event.
app.use('/api/events', eventRoutes);

// Backend för att hämta deltagare.
app.use('/api/participants', participantRoutes);

// Visar den färdigbyggda React-sidan.
const frontendPath = path.resolve(
    process.cwd(),
    'Frontend/react/dist'
);

app.use(express.static(frontendPath));

app.get('/', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
    console.log(`React och backend körs på http://localhost:${port}`);
});