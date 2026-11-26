
//Validation for registration is used in participantRoutes and tested in registration.test.ts

type RegistrationData = {
    travelOptionId: string;
    role: 'DRIVER' | 'PASSENGER';
    offeredSeats: number | null;
};

type RegistrationValidationResult =
    | { valid: true; data: RegistrationData }
    | { valid: false; message: string };

export function validateRegistration(
    body: unknown
): RegistrationValidationResult {
    if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body)
    ) {
        return {
            valid: false,
            message: 'Anmälans uppgifter är ogiltiga.',
        };
    }

    const input = body as Record<string, unknown>;

    if (
        typeof input.travelOptionId !== 'string' ||
        typeof input.role !== 'string'
    ) {
        return {
            valid: false,
            message: 'Anmälans uppgifter är ogiltiga.',
        };
    }

    const travelOptionId = input.travelOptionId.trim();
    const role = input.role;

    if (!travelOptionId) {
        return {
            valid: false,
            message: 'Välj ett resealternativ.',
        };
    }

    if (role !== 'DRIVER' && role !== 'PASSENGER') {
        return {
            valid: false,
            message: 'Ogiltig roll.',
        };
    }

    if (role === 'DRIVER') {
        if (
            typeof input.offeredSeats !== 'number' ||
            !Number.isInteger(input.offeredSeats) ||
            input.offeredSeats < 1 ||
            input.offeredSeats > 15
        ) {
            return {
                valid: false,
                message:
                    'Antal platser måste vara ett heltal mellan 1 och 15.',
            };
        }

        return {
            valid: true,
            data: {
                travelOptionId,
                role,
                offeredSeats: input.offeredSeats,
            },
        };
    }

    return {
        valid: true,
        data: {
            travelOptionId,
            role,
            offeredSeats: null,
        },
    };
}