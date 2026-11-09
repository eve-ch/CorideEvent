import { Router } from 'express';
import { prisma } from '../prisma';
import { randomUUID, randomBytes, createHash } from 'node:crypto';

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

eventRoutes.post(
    '/public/:shareToken/access-links',
    async (req, res) => {
        // Länkar får bara returneras direkt vid lokal testning.
        const localTesting =
            process.env.LOCAL_ACCESS_LINKS === 'true' &&
            process.env.NODE_ENV !== 'production';

        if (!localTesting) {
            res.status(503).json({
                message: 'Utskick av personliga länkar är inte aktiverat.',
            });
            return;
        }

        const body = req.body;

        if (
            !body ||
            typeof body.firstName !== 'string' ||
            typeof body.lastName !== 'string' ||
            typeof body.email !== 'string'
        ) {
            res.status(400).json({
                message: 'Ange förnamn, efternamn och mejladress.',
            });
            return;
        }

        const firstName = body.firstName.trim();
        const lastName = body.lastName.trim();
        const email = body.email.trim().toLowerCase();

        if (
            !firstName ||
            firstName.length > 100 ||
            !lastName ||
            lastName.length > 100 ||
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            res.status(400).json({
                message: 'Kontrollera namn och mejladress.',
            });
            return;
        }

        try {
            const event = await prisma.event.findUnique({
                where: {
                    share_token: req.params.shareToken,
                },
                select: {
                    id: true,
                    starts_at: true,
                },
            });

            if (!event) {
                res.status(404).json({
                    message: 'Eventet hittades inte.',
                });
                return;
            }

            // Tillfällig tolkning: sju dygn efter eventets start.
            const expiresAt = new Date(
                event.starts_at.getTime() +
                7 * 24 * 60 * 60 * 1000
            );

            if (expiresAt <= new Date()) {
                res.status(410).json({
                    message: 'Åtkomsten till eventet har upphört.',
                });
                return;
            }

            // Själva token används i länken.
            const token = randomBytes(32).toString('hex');

            // Bara hashen sparas i databasen.
            const tokenHash = createHash('sha256')
                .update(token)
                .digest('hex');

            await prisma.$transaction(async transaction => {
                const participant = await transaction.participant.upsert({
                    where: {
                        email,
                    },
                    update: {},
                    create: {
                        first_name: firstName,
                        last_name: lastName,
                        email,
                    },
                });

                await transaction.personalAccessLink.create({
                    data: {
                        event_id: event.id,
                        participant_id: participant.id,
                        token_hash: tokenHash,
                        expires_at: expiresAt,
                    },
                });
            });

            res.setHeader('Cache-Control', 'no-store');

            res.status(201).json({
                message: 'En personlig testlänk har skapats.',
                accessPath: `/access/${token}`,
                expiresAt: expiresAt.toISOString(),
            });
        } catch (error) {
            console.error('Kunde inte skapa personlig länk:', error);

            res.status(500).json({
                message: 'Kunde inte skapa den personliga länken.',
            });
        }
    }
);

eventRoutes.get('/access/:token', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    const token = req.params.token;

    if (!/^[a-f0-9]{64}$/.test(token)) {
        res.status(404).json({
            message: 'Den personliga länken är ogiltig.',
        });
        return;
    }

    try {
        const tokenHash = createHash('sha256')
            .update(token)
            .digest('hex');

        const link = await prisma.personalAccessLink.findUnique({
            where: {
                token_hash: tokenHash,
            },
            select: {
                expires_at: true,
                revoked_at: true,
                participant: {
                    select: {
                        first_name: true,
                    },
                },
                event: {
                    select: {
                        name: true,
                        description: true,
                        event_location: true,
                        starts_at: true,
                        application_deadline: true,
                    },
                },
            },
        });

        if (!link) {
            res.status(404).json({
                message: 'Den personliga länken är ogiltig.',
            });
            return;
        }

        if (
            link.revoked_at !== null ||
            link.expires_at <= new Date()
        ) {
            res.status(410).json({
                message: 'Den personliga länken gäller inte längre.',
            });
            return;
        }

        res.json({
            firstName: link.participant.first_name,
            event: link.event,
        });
    } catch (error) {
        console.error('Kunde inte kontrollera personlig länk:', error);

        res.status(500).json({
            message: 'Kunde inte öppna den personliga sidan.',
        });
    }
});