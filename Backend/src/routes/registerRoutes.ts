import { Router } from 'express';
import { prisma } from '../prisma';

export const registerRoutes = Router();

registerRoutes.post('/', async (req, res) => {
    const body = req.body;

    if (
        !body ||
        typeof body.firstName !== 'string' ||
        typeof body.lastName !== 'string' ||
        typeof body.email !== 'string'
    ) {
        return res.status(400).json({
            message: 'Ogiltiga uppgifter.',
        });
    }

    try {
        const participant =
            await prisma.participant.upsert({
                where: {
                    email: body.email,
                },

                update: {},

                create: {
                    first_name: body.firstName,
                    last_name: body.lastName,
                    email: body.email,
                },
            });

        res.status(201).json(
            participant
        );
    } catch (error) {
        res.status(500).json({
            message:
                'Kunde inte registrera deltagaren.',
        });
    }
});