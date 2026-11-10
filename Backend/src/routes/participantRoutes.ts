import {Router} from 'express';
import {prisma} from '../prisma';
import { createHash } from 'node:crypto';
import {eventRoutes} from "./eventRoutes";

export const participantRoutes = Router();

participantRoutes.get('/access/:token', async (req, res) => {
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
                participant_id: true,
                event_id: true,
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
                        travel_options: {
                            select: {
                                id: true,
                                place_name: true,
                                departure_time: true,
                                direction: true,
                            },
                            orderBy: {
                                departure_time: 'asc',
                            },
                        },
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

        const registrations = await prisma.rideRegistration.findMany({
            where: {
                participant_id: link.participant_id,
                event_id: link.event_id,
            },
            select: {
                id: true,
                role: true,
                offered_seats: true,
                status: true,
                travel_option: {
                    select: {
                        place_name: true,
                        departure_time: true,
                        direction: true,
                    },
                },
            },
            orderBy: {
                created_at: 'asc',
            },
        });

        res.json({
            firstName: link.participant.first_name,
            event: link.event,
            registrations,
        });

    } catch (error) {
        console.error('Kunde inte hämta personlig eventsida:', error);

        res.status(500).json({
            message: 'Kunde inte öppna den personliga sidan.',
        });
    }
});

participantRoutes.post('/access/:token/registrations', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    const token = req.params.token;
    const body = req.body;

    if (!/^[a-f0-9]{64}$/.test(token)) {
        res.status(404).json({
            message: 'Den personliga länken är ogiltig.',
        });
        return;
    }

    if (
        !body ||
        typeof body.travelOptionId !== 'string' ||
        !body.travelOptionId.trim() ||
        (body.role !== 'DRIVER' && body.role !== 'PASSENGER')
    ) {
        res.status(400).json({
            message: 'Välj resealternativ och en giltig roll.',
        });
        return;
    }

    const travelOptionId = body.travelOptionId.trim();
    const role = body.role;

    if (
        role === 'DRIVER' &&
        (
            typeof body.offeredSeats !== 'number' ||
            !Number.isInteger(body.offeredSeats) ||
            body.offeredSeats < 1 ||
            body.offeredSeats > 15
        )
    ) {
        res.status(400).json({
            message: 'Antal platser måste vara ett heltal mellan 1 och 15.',
        });
        return;
    }

    const offeredSeats = role === 'DRIVER' ? body.offeredSeats : null;

    try {
        const tokenHash = createHash('sha256')
            .update(token)
            .digest('hex');

        const result = await prisma.$transaction(async transaction => {
            const link = await transaction.personalAccessLink.findUnique({
                where: {
                    token_hash: tokenHash,
                },
                select: {
                    event_id: true,
                    participant_id: true,
                    expires_at: true,
                    revoked_at: true,
                    event: {
                        select: {
                            application_deadline: true,
                        },
                    },
                },
            });

            if (!link) {
                return {
                    status: 404,
                    body: { message: 'Den personliga länken är ogiltig.' },
                };
            }

            const now = new Date();

            if (link.revoked_at !== null || link.expires_at <= now) {
                return {
                    status: 410,
                    body: {
                        message: 'Den personliga länken gäller inte längre.',
                    },
                };
            }

            if (now > link.event.application_deadline) {
                return {
                    status: 400,
                    body: { message: 'Anmälningstiden har gått ut.' },
                };
            }

            const travelOption = await transaction.travelOption.findFirst({
                where: {
                    id: travelOptionId,
                    event_id: link.event_id,
                    direction: 'TO_EVENT',
                },
            });

            if (!travelOption) {
                return {
                    status: 400,
                    body: {
                        message: 'Välj ett giltigt ditresealternativ för eventet.',
                    },
                };
            }

            // Tillåt bara en ditreseanmälan per deltagare och event.
            const existing = await transaction.rideRegistration.findFirst({
                where: {
                    event_id: link.event_id,
                    participant_id: link.participant_id,
                    travel_option: {
                        direction: 'TO_EVENT',
                    },
                },
            });

            if (existing) {
                return {
                    status: 409,
                    body: {
                        message: 'Du har redan en ditreseanmälan till eventet.',
                    },
                };
            }

            const registration = await transaction.rideRegistration.create({
                data: {
                    event_id: link.event_id,
                    participant_id: link.participant_id,
                    travel_option_id: travelOption.id,
                    role,
                    offered_seats: offeredSeats,
                    status: 'REGISTERED',
                },
            });

            return {
                status: 201,
                body: {
                    message: 'Din reseanmälan har sparats.',
                    registrationId: registration.id,
                },
            };
        });

        res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Kunde inte spara reseanmälan:', error);

        res.status(500).json({
            message: 'Kunde inte spara reseanmälan. Försök igen senare.',
        });
    }
});

participantRoutes.get('/', async (_req, res) => {
    try {
        const participants =
            await prisma.participant.findMany({
                orderBy: {
                    first_name: 'asc',
                },
            });

        res.json(participants);
    } catch (error) {
        console.error(
            'Kunde inte hämta deltagare:',
            error
        );

        res.status(500).json({
            message:
                'Kunde inte hämta deltagare.',
        });
    }
});

participantRoutes.post('/', async (req, res) => {
    console.log(req.body);

    const body = req.body;

    if (
        !body ||
        typeof body.firstName !== 'string' ||
        typeof body.lastName !== 'string' ||
        typeof body.email !== 'string' ||
        typeof body.eventId !== 'string' ||
        typeof body.travelOptionId !== 'string' ||
        typeof body.role !== 'string'
    ) {
        res.status(400).json({
            message:
                'Anmälans uppgifter är ogiltiga.',
        });

        return;
    }

    const firstName =
        body.firstName.trim();

    const lastName =
        body.lastName.trim();

    const email =
        body.email.trim();

    const eventId =
        body.eventId;

    const travelOptionId =
        body.travelOptionId;

    const role =
        body.role;

    const offeredSeats =
        body.offeredSeats ?? null;

    if (
        !firstName ||
        !lastName ||
        !email
    ) {
        res.status(400).json({
            message:
                'Kontrollera förnamn, efternamn och e-post.',
        });

        return;
    }

    if (
        role !== 'DRIVER' &&
        role !== 'PASSENGER'
    ) {
        res.status(400).json({
            message:
                'Ogiltig roll.',
        });

        return;
    }

    if (
        role === 'DRIVER' &&
        (
            typeof offeredSeats !== 'number' ||
            offeredSeats < 1 ||
            offeredSeats > 15
        )
    ) {
        res.status(400).json({
            message:
                'Antal platser måste vara mellan 1 och 15.',
        });

        return;
    }

    try {
        const event =
            await prisma.event.findUnique({
                where: {
                    id: eventId,
                },
            });

        if (!event) {
            res.status(404).json({
                message:
                    'Eventet finns inte.',
            });

            return;
        }

        if (
            new Date() >
            event.application_deadline
        ) {
            res.status(400).json({
                message:
                    'Anmälningstiden har gått ut.',
            });

            return;
        }

        const travelOption =
            await prisma.travelOption.findUnique({
                where: {
                    id: travelOptionId,
                },
            });

        if (!travelOption) {
            res.status(404).json({
                message:
                    'Resealternativet finns inte.',
            });

            return;
        }

        const participant =
            await prisma.participant.upsert({
                where: {
                    email,
                },

                update: {
                    first_name: firstName,
                    last_name: lastName,
                },

                create: {
                    first_name: firstName,
                    last_name: lastName,
                    email,
                },
            });

        const registration =
            await prisma.rideRegistration.create({
                data: {
                    event_id:
                    event.id,

                    participant_id:
                    participant.id,

                    travel_option_id:
                    travelOption.id,

                    role,

                    offered_seats:
                        role === 'DRIVER'
                            ? offeredSeats
                            : null,

                    status:
                        'REGISTERED',
                },
            });

        res.status(201).json({
            participant,
            registration,
        });
    } catch (error) {
        console.error(
            'Kunde inte spara anmälan:',
            error
        );

        res.status(500).json({
            message:
                'Kunde inte spara anmälan.',
        });
    }
});