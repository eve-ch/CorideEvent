
import { Router } from 'express';
import { prisma } from '../../prisma';
import { isValidToken, hashToken } from './participantHelpers';


const router = Router();

// Flytta hit dina tre befintliga GET-routes.
// Behåll deras innehåll och svar precis som de är,
// men använd isValidToken() och hashToken() enligt ovan.


router.get('/access/:token', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    const token = req.params.token;

    if (!isValidToken(token)) {
        res.status(404).json({
            message: 'Den personliga länken är ogiltig.',
        });
        return;
    }

    try {
        const tokenHash = hashToken(token);

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
                        id: true,
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

router.get('/access/:token/events', async (req, res) => {
        res.setHeader('Cache-Control', 'no-store');

        const token = req.params.token;

    if (!isValidToken(token)) {
            res.status(404).json({
                message: 'Den personliga länken är ogiltig.',
            });
            return;
        }

        try {
            const tokenHash = hashToken(token);

            const link =
                await prisma.personalAccessLink.findUnique({
                    where: {
                        token_hash: tokenHash,
                    },
                    select: {
                        participant_id: true,
                        expires_at: true,
                        revoked_at: true,
                        participant: {
                            select: {
                                first_name: true,
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
                    message:
                        'Den personliga länken gäller inte längre.',
                });
                return;
            }

            const registrations =
                await prisma.rideRegistration.findMany({
                    where: {
                        participant_id:
                        link.participant_id,
                    },
                    select: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                starts_at: true,
                                event_location: true,
                            },
                        },
                    },
                });

            const events = Array.from(
                new Map(
                    registrations.map(reg => [
                        reg.event.id,
                        reg.event,
                    ])
                ).values()
            );

            res.json({
                firstName:
                link.participant.first_name,
                events,
            });

        } catch (error) {
            console.error(
                'Kunde inte hämta eventlista:',
                error
            );
            res.status(500).json({
                message:
                    'Kunde inte hämta eventlista.',
            });
        }
    });

router.get('/access/:token/events/:eventId', async (req, res) => {
        res.setHeader('Cache-Control', 'no-store');

        const token = req.params.token;
        const eventId = req.params.eventId;

    if (!isValidToken(token)){
            res.status(404).json({
                message: 'Den personliga länken är ogiltig.',
            });
            return;
        }

        try {
            // 1. Omvandla token till hash
            const tokenHash = hashToken(token);

            // 2. Hämta den personliga länken
            const link = await prisma.personalAccessLink.findUnique({
                where: {
                    token_hash: tokenHash,
                },
                select: {
                    participant_id: true,
                    expires_at: true,
                    revoked_at: true,
                    participant: {
                        select: {
                            first_name: true,
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

            // 3. Kontrollera att länken fortfarande är giltig
            if (
                link.revoked_at !== null ||
                link.expires_at <= new Date()
            ) {
                res.status(410).json({
                    message: 'Den personliga länken gäller inte längre.',
                });
                return;
            }

            // 4. Kontrollera att deltagaren är registrerad till eventet
            const registration = await prisma.rideRegistration.findFirst({
                where: {
                    participant_id: link.participant_id,
                    event_id: eventId,
                },
            });

            if (!registration) {
                res.status(404).json({
                    message: 'Eventet hittades inte.',
                });
                return;
            }

            // 5. Hämta information om det valda eventet
            const event = await prisma.event.findUnique({
                where: {
                    id: eventId,
                },
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
            });

            if (!event) {
                res.status(404).json({
                    message: 'Eventet hittades inte.',
                });
                return;
            }

            // 6. Hämta deltagarens alla registreringar till eventet
            const registrations = await prisma.rideRegistration.findMany({
                where: {
                    participant_id: link.participant_id,
                    event_id: eventId,
                },
                select: {
                    id: true,
                    role: true,
                    offered_seats: true,
                    status: true,
                    travel_option: {
                        select: {
                            id: true,
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

            // 7. Skicka informationen till frontend
            res.json({
                firstName: link.participant.first_name,
                event,
                registrations,
            });

        } catch (error) {
            console.error(
                'Kunde inte hämta valt event:',
                error
            );

            res.status(500).json({
                message: 'Kunde inte öppna eventet.',
            });
        }
    });

export default router;