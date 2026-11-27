
import { Router } from 'express';
import { prisma } from '../../prisma';
import { isValidToken, hashToken } from './participantHelpers';

const router = Router();

// Flytta hit dina tre befintliga POST-, DELETE- och PUT-routes.
// Behåll deras innehåll precis som det är,
// men använd isValidToken() och hashToken() enligt ovan.

router.post('/access/:token/registrations', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    const token = req.params.token;
    const body = req.body;

    if (!isValidToken(token)) {
        res.status(404).json({
            message: 'Den personliga länken är ogiltig.',
        });
        return;
    }

    if (
        !body ||
        typeof body.travelOptionId !== 'string' ||
        typeof body.role !== 'string'
    ) {
        res.status(400).json({
            message: 'Anmälans uppgifter är ogiltiga.',
        });
        return;
    }

    const travelOptionId = body.travelOptionId.trim();
    const role = body.role;
    const wantsReturnTrip =
        body.wantsReturnTrip === true;

    if (!travelOptionId) {
        res.status(400).json({
            message: 'Välj ett resealternativ.',
        });
        return;
    }

    if (
        role !== 'DRIVER' &&
        role !== 'PASSENGER'
    ) {
        res.status(400).json({
            message: 'Ogiltig roll.',
        });

        return;
    }

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

    const returnOfferedSeats =
        typeof body.returnOfferedSeats === 'number'
            ? body.returnOfferedSeats
            : null;

    if (
        wantsReturnTrip &&
        role === 'DRIVER' &&
        (
            !Number.isInteger(returnOfferedSeats) ||
            returnOfferedSeats! < 1 ||
            returnOfferedSeats! > 15
        )
    ) {
        res.status(400).json({
            message: 'Antal platser på hemresan måste vara mellan 1 och 15.',
        });
        return;
    }

    try {
        const tokenHash = hashToken(token);

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

            const eventId =
                typeof body.eventId === 'string' && body.eventId.trim()
                    ? body.eventId.trim()
                    : link.event_id;

// Om det är ett annat event än det ursprungliga,
// kontrollera att deltagaren redan är registrerad där.
            if (eventId !== link.event_id) {
                const participantHasEvent =
                    await transaction.rideRegistration.findFirst({
                        where: {
                            event_id: eventId,
                            participant_id: link.participant_id,
                        },
                    });

                if (!participantHasEvent) {
                    return {
                        status: 404,
                        body: { message: 'Eventet hittades inte.' },
                    };
                }
            }
///////////////////////////////////
            const event = await transaction.event.findUnique({
                where: { id: eventId },
                select: {
                    application_deadline: true,
                    event_location: true,
                    starts_at: true,
                },
            });
            /*
            const event = await transaction.event.findUnique({
                where: { id: eventId },
                select: { application_deadline: true },
            });

             */

            if (!event) {
                return {
                    status: 404,
                    body: { message: 'Eventet hittades inte.' },
                };
            }

            if (now > event.application_deadline) {
                return {
                    status: 400,
                    body: { message: 'Anmälningstiden har gått ut.' },
                };
            }

            const travelOption = await transaction.travelOption.findFirst({
                where: {
                    id: travelOptionId,
                    event_id: eventId,
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
                    event_id: eventId,
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
                    event_id: eventId,
                    participant_id: link.participant_id,
                    travel_option_id: travelOption.id,
                    role,
                    offered_seats: offeredSeats,
                    status: 'REGISTERED',
                },
            });

///////////////////////////////
            if (wantsReturnTrip) {
                let returnTravelOption =
                    await transaction.travelOption.findFirst({
                        where: {
                            event_id: eventId,
                            direction: 'FROM_EVENT',
                        },
                    });

                if (!returnTravelOption) {
                    returnTravelOption =
                        await transaction.travelOption.create({
                            data: {
                                event_id: eventId,
                                place_name: event.event_location,
                                departure_time: new Date(
                                    event.starts_at.getTime() + 4 * 60 * 60 * 1000
                                ),
                                direction: 'FROM_EVENT',
                            },
                        });
                }

                await transaction.rideRegistration.create({
                    data: {
                        event_id: eventId,
                        participant_id: link.participant_id,
                        travel_option_id: returnTravelOption.id,
                        role,
                        offered_seats:
                            role === 'DRIVER' ? returnOfferedSeats : null,
                        status: 'REGISTERED',
                    },
                });
            }

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

router.delete('/access/:token/registrations/:registrationId', async (req, res) => {
        const token = req.params.token;

    if (!isValidToken(token)){
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
                res.status(404).json({
                    message: 'Den personliga länken är ogiltig.',
                });
                return;
            }

            const now = new Date();

            if (
                link.revoked_at !== null ||
                link.expires_at <= now
            ) {
                res.status(410).json({
                    message: 'Den personliga länken gäller inte längre.',
                });
                return;
            }

            const registration =
                await prisma.rideRegistration.findFirst({
                    where: {
                        id: req.params.registrationId,
                        participant_id: link.participant_id,
                    },
                });

            if (!registration) {
                res.status(404).json({
                    message: 'Anmälan hittades inte.',
                });
                return;
            }

            const event = await prisma.event.findUnique({
                where: {
                    id: registration.event_id,
                },
                select: {
                    application_deadline: true,
                },
            });

            if (!event) {
                res.status(404).json({
                    message: 'Eventet hittades inte.',
                });
                return;
            }

            if (now > event.application_deadline) {
                res.status(400).json({
                    message: 'Anmälningstiden har gått ut.',
                });
                return;
            }

            await prisma.rideRegistration.delete({
                where: {
                    id: registration.id,
                },
            });

            res.json({
                message: 'Anmälan har tagits bort.',
            });
        } catch (error) {
            console.error(
                'Kunde inte ta bort anmälan:',
                error
            );

            res.status(500).json({
                message: 'Kunde inte ta bort anmälan.',
            });
        }
    });

router.put('/access/:token/registrations/:registrationId', async (req, res) => {
        const token = req.params.token;
        const registrationId = req.params.registrationId;
        const body = req.body;

    if (!isValidToken(token)) {
            res.status(404).json({
                message: 'Den personliga länken är ogiltig.',
            });
            return;
        }

        if (
            !body ||
            typeof body.travelOptionId !== 'string' ||
            typeof body.role !== 'string'
        ) {
            res.status(400).json({
                message: 'Anmälans uppgifter är ogiltiga.',
            });
            return;
        }

        const travelOptionId = body.travelOptionId.trim();
        const role = body.role;

        const wantsReturnTrip =
            body.wantsReturnTrip === true;

        const returnOfferedSeats =
            typeof body.returnOfferedSeats === 'number'
                ? body.returnOfferedSeats
                : null;

        if (!travelOptionId) {
            res.status(400).json({
                message: 'Välj ett resealternativ.',
            });
            return;
        }

        if (
            role !== 'DRIVER' &&
            role !== 'PASSENGER'
        ) {
            res.status(400).json({
                message: 'Ogiltig roll.',
            });
            return;
        }

        if (
            wantsReturnTrip &&
            role === 'DRIVER' &&
            (
                typeof returnOfferedSeats !== 'number' ||
                !Number.isInteger(returnOfferedSeats) ||
                returnOfferedSeats < 1 ||
                returnOfferedSeats > 15
            )
        ) {
            res.status(400).json({
                message:
                    'Antal platser på hemresan måste vara mellan 1 och 15.',
            });
            return;
        }

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

        const offeredSeats =
            role === 'DRIVER'
                ? body.offeredSeats
                : null;

        try {
            const tokenHash = hashToken(token);

            const link =
                await prisma.personalAccessLink.findUnique({
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
                res.status(404).json({
                    message: 'Den personliga länken är ogiltig.',
                });
                return;
            }

            const now = new Date();

            if (
                link.revoked_at !== null ||
                link.expires_at <= now
            ) {
                res.status(410).json({
                    message:
                        'Den personliga länken gäller inte längre.',
                });
                return;
            }

            const eventId =
                typeof body.eventId === 'string' && body.eventId.trim()
                    ? body.eventId.trim()
                    : link.event_id;

            const participantHasEvent =
                await prisma.rideRegistration.findFirst({
                    where: {
                        event_id: eventId,
                        participant_id: link.participant_id,
                    },
                });

            if (!participantHasEvent) {
                res.status(404).json({
                    message: 'Eventet hittades inte.',
                });
                return;
            }

            const event = await prisma.event.findUnique({
                where: { id: eventId },
                select: {
                    application_deadline: true,
                    event_location: true,
                    starts_at: true,
                },
            });

            if (!event) {
                res.status(404).json({
                    message: 'Eventet hittades inte.',
                });
                return;
            }

            if (now > event.application_deadline) {
                res.status(400).json({
                    message: 'Anmälningstiden har gått ut.',
                });
                return;
            }

            const travelOption =
                await prisma.travelOption.findFirst({
                    where: {
                        id: travelOptionId,
                        event_id: eventId,
                        direction: 'TO_EVENT',
                    },
                });

            if (!travelOption) {
                res.status(400).json({
                    message:
                        'Välj ett giltigt ditresealternativ för eventet.',
                });
                return;
            }

            const registration =
                await prisma.rideRegistration.findFirst({
                    where: {
                        id: registrationId,
                        participant_id: link.participant_id,
                        event_id: eventId,
                    },
                });

            if (!registration) {
                res.status(404).json({
                    message: 'Anmälan hittades inte.',
                });
                return;
            }

            /*
            const returnTravelOption = wantsReturnTrip
                ? await prisma.travelOption.findFirst({
                    where: {
                        event_id: link.event_id,
                        place_name: travelOption.place_name,
                        direction: 'FROM_EVENT',
                    },
                })
                : null;


             */

            await prisma.$transaction(async (transaction) => {

                // Uppdatera utresan
                await transaction.rideRegistration.update({
                    where: {
                        id: registrationId,
                    },
                    data: {
                        role,
                        offered_seats: offeredSeats,
                        travel_option_id: travelOptionId,
                    },
                });

                // Hitta deltagarens eventuella hemresa
                const returnRegistration =
                    await transaction.rideRegistration.findFirst({
                        where: {
                            participant_id: link.participant_id,
                            event_id: eventId,
                            travel_option: {
                                direction: 'FROM_EVENT',
                            },
                        },
                    });

                if (wantsReturnTrip) {

                    // Hitta eventets automatiska hemresealternativ
                    let returnTravelOption =
                        await transaction.travelOption.findFirst({
                            where: {
                                event_id: eventId,
                                direction: 'FROM_EVENT',
                            },
                        });

                    // Skapa det automatiskt om det saknas
                    if (!returnTravelOption) {
                        returnTravelOption =
                            await transaction.travelOption.create({
                                data: {
                                    event_id: eventId,
                                    place_name: event.event_location,
                                    departure_time: new Date(
                                        event.starts_at.getTime() + 4 * 60 * 60 * 1000
                                    ),
                                    direction: 'FROM_EVENT',
                                },
                            });
                    }

                    const returnData = {
                        role,
                        offered_seats:
                            role === 'DRIVER'
                                ? Number(returnOfferedSeats)
                                : null,
                        travel_option_id: returnTravelOption.id,
                    };

                    if (returnRegistration) {

                        // Uppdatera befintlig hemresa
                        await transaction.rideRegistration.update({
                            where: {
                                id: returnRegistration.id,
                            },
                            data: returnData,
                        });

                    } else {

                        // Skapa hemresa
                        await transaction.rideRegistration.create({
                            data: {
                                event_id: eventId,
                                participant_id: link.participant_id,
                                ...returnData,
                                status: 'REGISTERED',
                            },
                        });
                    }

                } else if (returnRegistration) {

                    // Deltagaren valde Nej – ta bort hemresan
                    await transaction.rideRegistration.delete({
                        where: {
                            id: returnRegistration.id,
                        },
                    });
                }
            });






            res.json({
                message: 'Anmälan har uppdaterats.',
            });

        } catch (error) {
            console.error(
                'Kunde inte uppdatera anmälan:',
                error
            );

            res.status(500).json({
                message:
                    'Kunde inte uppdatera anmälan.',
            });
        }
    });

export default router;