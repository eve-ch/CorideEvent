import {Router} from 'express';
import {prisma} from '../prisma';

export const participantRoutes = Router();

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