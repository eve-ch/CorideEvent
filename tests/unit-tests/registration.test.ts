import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration } from '../../Backend/src/validation/registrationValidation';


test('[ID: U-T17, Krav: 3.2.2, 3.2.14] accepts a driver with valid seats', () => {
    for (const offeredSeats of [1, 4, 15]) {
        const result = validateRegistration({
            travelOptionId: 'travel-1',
            role: 'DRIVER',
            offeredSeats,
        });

        if (result.valid === false) {assert.fail(result.message);}

        assert.deepEqual(result.data, {
            travelOptionId: 'travel-1',
            role: 'DRIVER',
            offeredSeats,
        });
    }
});


test('[ID: U-T18, Krav: 3.2.2] accepts a passenger and sets seats to null', () => {
    for (const offeredSeats of [undefined, null, 4]) {
        const result = validateRegistration({
            travelOptionId: 'travel-1',
            role: 'PASSENGER',
            offeredSeats,
        });

        if (result.valid === false) {assert.fail(result.message);}

        assert.deepEqual(result.data, {
            travelOptionId: 'travel-1',
            role: 'PASSENGER',
            offeredSeats: null,
        });
    }
});


test('[ID: U-T19, Krav: 3.2.3] rejects missing or blank travel options', () => {
    for (const travelOptionId of [undefined, '', '   ']) {
        const result = validateRegistration({
            travelOptionId,
            role: 'PASSENGER',
        });

        if (result.valid === true) {
            assert.fail(`Resealternativet ${JSON.stringify(travelOptionId)} ska nekas.`);
        }

        assert.equal(
            result.message,
            travelOptionId === undefined
                ? 'Anmälans uppgifter är ogiltiga.'
                : 'Välj ett resealternativ.'
        );
    }
});


test('[ID: U-T20, Krav: 3.2.2] rejects missing or invalid roles', () => {
    for (const role of [undefined, '', '   ', 'ADMIN', 'driver']) {
        const result = validateRegistration({
            travelOptionId: 'travel-1',
            role,
            offeredSeats: 4,
        });

        if (result.valid === true) {
            assert.fail(`Rollen ${JSON.stringify(role)} ska nekas.`);
        }

        assert.equal(
            result.message,
            role === undefined
                ? 'Anmälans uppgifter är ogiltiga.'
                : 'Ogiltig roll.'
        );
    }
});


test('[ID: U-T21, Krav: 3.2.14] rejects invalid driver seats', () => {
    for (const offeredSeats of [
        undefined,
        null,
        '4',
        true,
        0,
        -1,
        16,
        1.5,
        NaN,
        Infinity,
    ]) {
        const result = validateRegistration({
            travelOptionId: 'travel-1',
            role: 'DRIVER',
            offeredSeats,
        });

        if (result.valid === true) {
            assert.fail(`Antalet platser ${String(offeredSeats)} ska nekas.`);
        }

        assert.equal(result.message, 'Antal platser måste vara ett heltal mellan 1 och 15.');
    }
});


test('[ID: U-T22] rejects invalid input structure', () => {
    for (const body of [undefined, null, 'registration', 123, true, []]) {
        const result = validateRegistration(body);

        if (result.valid === true) {
            assert.fail(`Indata ${JSON.stringify(body)} ska nekas.`);
        }

        assert.equal(result.message, 'Anmälans uppgifter är ogiltiga.');
    }
});


test('[ID: U-T23] rejects incorrect types for travel option and role', () => {
    for (const field of ['travelOptionId', 'role'] as const) {
        for (const value of [123, true, null, [], {}]) {
            const result = validateRegistration({
                travelOptionId: 'travel-1',
                role: 'DRIVER',
                offeredSeats: 4,
                [field]: value,
            });

            if (result.valid === true) {
                assert.fail(`${field} med värdet ${JSON.stringify(value)} ska nekas.`);
            }

            assert.equal(result.message, 'Anmälans uppgifter är ogiltiga.');
        }
    }
});