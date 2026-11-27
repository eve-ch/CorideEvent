import express from 'express';
import path from 'node:path';
import { eventRoutes } from './routes/eventRoutes';
import { registerRoutes } from './routes/registerRoutes';
import { participantRoutes } from './routes/participantRoutes';
import { authRoutes } from './routes/authRoutes';
import 'dotenv/config';
import session from 'express-session';

const app = express();
const port = 3000;

app.use(express.json());

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
    throw new Error('SESSION_SECRET saknas i .env.');
}

app.use(
    session({
        name: 'coride.sid',
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: false, // Lokal körning på http://localhost.
            maxAge: 8 * 60 * 60 * 1000,
        },
    })
);

app.use('/api/auth', authRoutes);

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

app.get('/access/:token/events', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/access/:token/events/:eventId', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    if (!req.session.organizerId) {
        res.redirect('/');
        return;
    }

    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
    console.log(`React och backend körs på http://localhost:${port}`);
});