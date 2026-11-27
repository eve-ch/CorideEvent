import { Router } from 'express';
import { prisma } from '../prisma';
import { randomUUID } from 'node:crypto';
import { validateEvent } from '../validation/eventValidation';

export const eventRoutes = Router();

eventRoutes.get('/', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    const organizerId = req.session.organizerId;

    if (!organizerId) {
        res.status(401).json({
            message: 'Du måste vara inloggad.',
        });
        return;
    }

    try {
        const events = await prisma.event.findMany({
            where: {
                organizer_id: organizerId,
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
    res.setHeader('Cache-Control', 'no-store');

    const organizerId = req.session.organizerId;

    if (!organizerId) {
        res.status(401).json({
            message: 'Du måste vara inloggad.',
        });
        return;
    }

    const result = validateEvent(req.body, new Date());

    if (!result.valid) {
        res.status(400).json({
            message: result.message,
        });
        return;
    }

    const {
        name,
        location,
        description,
        startsAt,
        deadline,
    } = result.data;

    try {

        const event = await prisma.event.create({
            data: {
                organizer_id: organizerId,
                name,
                description: description || null,
                event_location: location,
                starts_at: startsAt,
                application_deadline: deadline,
                share_token: randomUUID(),
                matching_status: 'NOT_STARTED',
                travel_options: {
                    create: [
                        {
                            place_name: 'Standardstartplats – testalternativ',
                            departure_time: new Date(
                                startsAt.getTime() - 60 * 60 * 1000
                            ),
                            direction: 'TO_EVENT',
                        },
                        /////////////////////////////
                        {
                            place_name: location,
                            departure_time: new Date(
                                startsAt.getTime() + 4 * 60 * 60 * 1000
                            ),
                            direction: 'FROM_EVENT',
                        },
                    ],
                },
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