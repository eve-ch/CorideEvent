
//Validation for events used in eventRoutes.ts and tested in eventValidation.test.ts

type ValidatedEvent = {
    name: string;
    location: string;
    description: string;
    startsAt: Date;
    deadline: Date;
};

type EventValidationResult =
    | { valid: true; data: ValidatedEvent }
    | { valid: false; message: string };

export function validateEvent(
    body: unknown,
    now: Date
): EventValidationResult {
    if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body)
    ) {
        return {
            valid: false,
            message: 'Eventets uppgifter är ogiltiga.',
        };
    }

    const input = body as Record<string, unknown>;

    if (
        typeof input.name !== 'string' ||
        typeof input.eventLocation !== 'string' ||
        typeof input.startsAt !== 'string' ||
        typeof input.applicationDeadline !== 'string' ||
        (
            input.description !== undefined &&
            typeof input.description !== 'string'
        )
    ) {
        return {
            valid: false,
            message: 'Eventets uppgifter är ogiltiga.',
        };
    }

    const name = input.name.trim();
    const location = input.eventLocation.trim();
    const description = (input.description ?? '').trim();
    const startsAt = new Date(input.startsAt);
    const deadline = new Date(input.applicationDeadline);

    if (
        !name || name.length > 200 ||
        !location || location.length > 300 ||
        !description || description.length > 5000
    ) {
        return {
            valid: false,
            message: 'Kontrollera eventnamn, plats och beskrivning.',
        };
    }

    if (
        !Number.isFinite(startsAt.getTime()) ||
        !Number.isFinite(deadline.getTime())
    ) {
        return {
            valid: false,
            message: 'Ange giltiga datum och tider.',
        };
    }

    if (startsAt <= now || deadline > startsAt) {
        return {
            valid: false,
            message:
                'Starten måste vara i framtiden och sista anmälan senast vid starten.',
        };
    }

    return {
        valid: true,
        data: {
            name,
            location,
            description,
            startsAt,
            deadline,
        },
    };
}