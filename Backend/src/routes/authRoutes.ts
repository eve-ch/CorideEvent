import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import 'express-session';

declare module 'express-session' {
    interface SessionData {
        organizerId: string;
    }
}

export const authRoutes = Router();

authRoutes.post('/login', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    const body = req.body;

    if (
        !body ||
        typeof body.email !== 'string' ||
        typeof body.password !== 'string'
    ) {
        res.status(400).json({
            message: 'Ange mejladress och lösenord.',
        });
        return;
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (
        !email ||
        email.length > 254 ||
        !password ||
        Buffer.byteLength(password, 'utf8') > 72
    ) {
        res.status(400).json({
            message: 'Kontrollera mejladress och lösenord.',
        });
        return;
    }

    try {
        const organizer = await prisma.organizer.findUnique({
            where: { email },
        });

        const validPassword = organizer
            ? await bcrypt.compare(password, organizer.password_hash)
            : false;

        if (!organizer || !validPassword) {
            res.status(401).json({
                message: 'Fel mejladress eller lösenord.',
            });
            return;
        }

        req.session.regenerate(error => {
            if (error) {
                console.error('Kunde inte skapa session:', error);
                res.status(500).json({
                    message: 'Kunde inte logga in.',
                });
                return;
            }

            req.session.organizerId = organizer.id;

            req.session.save(error => {
                if (error) {
                    console.error('Kunde inte spara session:', error);
                    res.status(500).json({
                        message: 'Kunde inte logga in.',
                    });
                    return;
                }

                res.json({
                    organizer: {
                        id: organizer.id,
                        name: organizer.name,
                    },
                });
            });
        });
    } catch (error) {
        console.error('Inloggningen misslyckades:', error);
        res.status(500).json({
            message: 'Kunde inte logga in.',
        });
    }
});

authRoutes.post('/logout', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    req.session.destroy(error => {
        if (error) {
            console.error('Kunde inte avsluta sessionen:', error);
            res.status(500).json({
                message: 'Kunde inte logga ut.',
            });
            return;
        }

        res.clearCookie('coride.sid', {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
        });

        res.sendStatus(204);
    });
});