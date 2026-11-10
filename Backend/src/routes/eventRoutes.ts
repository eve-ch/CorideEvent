import { Router } from 'express';
import { prisma } from '../prisma';
import { randomUUID } from 'node:crypto';

export const eventRoutes = Router();

// Tillfällig arrangör för lokal testning.
// Ersätts med den inloggade arrangören när inloggning finns.
async function getTestOrganizer() {
    return prisma.organizer.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            name: 'Testarrangör',
            email: 'test@example.com',
            password_hash: 'LOCAL_TEST_NO_LOGIN',
        },
    });
}

eventRoutes.get('/', async (_req, res) => {
    try {
        const organizer = await getTestOrganizer();

        const events = await prisma.event.findMany({
            where: {
                organizer_id: organizer.id,
            },
            orderBy: {
                starts_at: 'asc',
            },
        });

        res.json(events);
    } catch (error) {
        console.error('Kunde inte hämta event:', error);
        res.status(500).json({
            message: 'Kunde inte hämta event.',
        });
    }
});

eventRoutes.post('/', async (req, res) => {
    const body = req.body;

    if (
        !body ||
        typeof body.name !== 'string' ||
        typeof body.eventLocation !== 'string' ||
        typeof body.startsAt !== 'string' ||
        typeof body.applicationDeadline !== 'string' ||
        (body.description !== undefined &&
            typeof body.description !== 'string')
    ) {
        res.status(400).json({
            message: 'Eventets uppgifter är ogiltiga.',
        });
        return;
    }

    const name = body.name.trim();
    const location = body.eventLocation.trim();
    const description = (body.description ?? '').trim();
    const startsAt = new Date(body.startsAt);
    const deadline = new Date(body.applicationDeadline);

    if (
        !name || name.length > 200 ||
        !location || location.length > 300 ||
        description.length > 5000
    ) {
        res.status(400).json({
            message: 'Kontrollera eventnamn, plats och beskrivning.',
        });
        return;
    }

    if (
        !Number.isFinite(startsAt.getTime()) ||
        !Number.isFinite(deadline.getTime())
    ) {
        res.status(400).json({
            message: 'Ange giltiga datum och tider.',
        });
        return;
    }

    if (startsAt <= new Date() || deadline > startsAt) {
        res.status(400).json({
            message:
                'Starten måste vara i framtiden och sista anmälan senast vid starten.',
        });
        return;
    }

    try {
        const organizer = await getTestOrganizer();

        const event = await prisma.event.create({
            data: {
                organizer_id: organizer.id,
                name,
                description: description || null,
                event_location: location,
                starts_at: startsAt,
                application_deadline: deadline,
                share_token: randomUUID(),
                matching_status: 'NOT_STARTED',
            },
        });

        res.status(201).json(event);
    } catch (error) {
        console.error('Kunde inte spara event:', error);
        res.status(500).json({
            message: 'Kunde inte spara event.',
        });
    }
});
eventRoutes.get('/public/:shareToken', async (req, res) => {
    try {
        const event = await prisma.event.findUnique({
            where: {
                share_token: req.params.shareToken,
            },
            select: {
                name: true,
                description: true,
                event_location: true,
                starts_at: true,
                application_deadline: true,
            },
        });

        if (!event) {
            res.status(404).json({
                message: 'Eventet hittades inte. Kontrollera länken.',
            });
            return;
        }

        res.json(event);
    } catch (error) {
        console.error('Kunde inte hämta publikt event:', error);

        res.status(500).json({
            message: 'Kunde inte hämta eventet.',
        });
    }
});