import { Router } from 'express';
import { prisma } from '../prisma';
import { randomBytes, createHash } from 'node:crypto';

export const registerRoutes = Router();

registerRoutes.post(
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
