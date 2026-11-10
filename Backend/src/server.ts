import express from 'express';
import path from 'node:path';
import { eventRoutes } from './routes/eventRoutes';
import { registerRoutes } from './routes/registerRoutes';
import { participantRoutes } from './routes/participantRoutes';

const app = express();
const port = 3000;

app.use(express.json());

// Backend för att hämta och skapa event.
app.use('/api/events', eventRoutes);
app.use('/api/events', registerRoutes);
app.use('/api/events', participantRoutes);

// Visar den färdigbyggda React-sidan.
const frontendPath = path.resolve(
    process.cwd(),
    'Frontend/react/dist'
);

app.use(express.static(frontendPath));

app.get('/', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/event/:shareToken', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/access/:token', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
    console.log(`React och backend körs på http://localhost:${port}`);
});