import express from 'express';
import path from 'node:path';
import { eventRoutes } from './routes/eventRoutes';

const app = express();
const port = 3000;

app.use(express.json());

// Anrop för att hämta och senare skapa event.
app.use('/api/events', eventRoutes);

// Visar filerna i Frontend.
const frontendPath = path.resolve(process.cwd(), 'Frontend/react/dist');
app.use(express.static(frontendPath));

app.get('/', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
    console.log(`Servern körs på http://localhost:${port}`);
});