import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEvent } from '../../Backend/src/validation/eventValidation';

//Dessa test testar validering i eventValidation.ts
//I varje test anges test id, tex U-T1 och vilka krav det testar, eller delar av dem.

test('[ID: U-T1, Krav: 3.1.3 a, 3.3.2 a] rejects an empty or blank event name', () => {
    // Förbereder giltiga uppgifter, men tomt namn.
    const now = new Date('2026-01-01T10:00:00Z');
    for (const name of ['', '   ']) {
        const body = {
            name,
            eventLocation: 'Helsingborg',
            description: 'En mässa på campus.',
            startsAt: '2026-02-01T12:00:00Z',
            applicationDeadline: '2026-01-25T12:00:00Z',
        };

        // Kör validerings-funktionen
        const result = validateEvent(body, now);

        // Kontrollera att uppgifterna nekas
        assert.equal(result.valid, false, `Namnet ${JSON.stringify(name)} ska nekas.`);
        //Fel om uppgifterna passerar
        if (result.valid) {assert.fail('Ett tomt eventnamn ska nekas.');}
        //Kontrollera felmeddelande
        assert.equal(result.message, 'Kontrollera eventnamn, plats och beskrivning.');
    }
});


test('[ID: U-T2, Krav: 3.1.3, 3.1.8, 3.3.2] accepts valid event data', () => {
    //Förbereder giltiga uppgifter/indata
    const now = new Date('2026-01-01T10:00:00Z');
    const body = {
        name: 'Campusmässa',
        eventLocation: 'Helsingborg',
        description: 'En mässa på campus.',
        startsAt: '2026-02-01T12:00:00Z',
        applicationDeadline: '2026-01-25T12:00:00Z',
    };

    //Kör validering
    const result = validateEvent(body, now);

    //Kontrollerar resultat
    if (result.valid === false) {assert.fail(result.message);}
    assert.equal(result.data.name, body.name);
    assert.equal(result.data.location, body.eventLocation);
    assert.equal(result.data.description, body.description);
    assert.equal(result.data.startsAt.getTime(), Date.parse(body.startsAt));
    assert.equal(result.data.deadline.getTime(), Date.parse(body.applicationDeadline));
});


test('[ID: U-T3, Krav: 3.1.3 b, 3.3.2 e] rejects blank event locations', () => {
    const now = new Date('2026-01-01T10:00:00Z');

    for (const eventLocation of ['', '   ']) {
        const body = {
            name: 'Campusmässa',
            eventLocation,
            description: 'En mässa på campus.',
            startsAt: '2026-02-01T12:00:00Z',
            applicationDeadline: '2026-01-25T12:00:00Z',
        };

        const result = validateEvent(body, now);
        if (result.valid === true) {
            assert.fail(`Platsen ${JSON.stringify(eventLocation)} ska nekas.`);
        }
        assert.equal(result.message, 'Kontrollera eventnamn, plats och beskrivning.');
    }
});


test('[ID: U-T4, Krav: 3.1.3 c–d, 3.3.2 c–d] rejects missing or blank event start', () => {
    const now = new Date('2026-01-01T10:00:00Z');

    for (const startsAt of [undefined, '', '   ']) {
        const body = {
            name: 'Campusmässa',
            eventLocation: 'Helsingborg',
            description: 'En mässa på campus.',
            startsAt,
            applicationDeadline: '2026-01-25T12:00:00Z',
        };

        const result = validateEvent(body, now);

        if (result.valid === true) {
            assert.fail(`Starten ${JSON.stringify(startsAt)} ska nekas.`);
        }
        assert.equal(result.message, startsAt === undefined ? 'Eventets uppgifter är ogiltiga.' : 'Ange giltiga datum och tider.');
    }
});


test('[ID: U-T5, Krav: 3.1.3 e, 3.1.8, 3.3.3] rejects missing or blank application deadline', () => {
    const now = new Date('2026-01-01T10:00:00Z');

    for (const applicationDeadline of [undefined, '', '   ']) {
        const body = {
            name: 'Campusmässa',
            eventLocation: 'Helsingborg',
            description: 'En mässa på campus.',
            startsAt: '2026-02-01T12:00:00Z',
            applicationDeadline,
        };

        const result = validateEvent(body, now);

        if (result.valid === true) {
            assert.fail(`Deadline ${JSON.stringify(applicationDeadline)} ska nekas.`);
        }
        assert.equal(result.message, applicationDeadline === undefined ? 'Eventets uppgifter är ogiltiga.' : 'Ange giltiga datum och tider.');
    }
});


test('[ID: U-T6, Krav: 3.1.3 f, 3.3.2 f] rejects missing or blank description', () => {
    const now = new Date('2026-01-01T10:00:00Z');

    for (const description of [undefined, '', '   ']) {
        const body = {
            name: 'Campusmässa',
            eventLocation: 'Helsingborg',
            description,
            startsAt: '2026-02-01T12:00:00Z',
            applicationDeadline: '2026-01-25T12:00:00Z',
        };

        const result = validateEvent(body, now);
        if (result.valid === true) {assert.fail(`Beskrivningen ${JSON.stringify(description)} ska nekas.`);}
        assert.equal(result.message, 'Kontrollera eventnamn, plats och beskrivning.');
    }
});


//Teknisk skyddskontroll
test('[ID: U-T7] rejects invalid input structure', () => {
    const now = new Date('2026-01-01T10:00:00Z');
    for (const body of [undefined, null, 'event', 123, true, []]) {
        const result = validateEvent(body, now);
        if (result.valid === true) {
            assert.fail(`Indata ${JSON.stringify(body)} ska nekas.`);
        }
        assert.equal(result.message, 'Eventets uppgifter är ogiltiga.', `Felmeddelandet ska stämma för ${JSON.stringify(body)}.`);
    }
});


test('[ID: U-T8, Krav: 3.1.3, 3.3.2 a, c–f] rejects incorrect field types', () => {
    const now = new Date('2026-01-01T10:00:00Z');

    const validBody = {
        name: 'Campusmässa',
        eventLocation: 'Helsingborg',
        description: 'En mässa på campus.',
        startsAt: '2026-02-01T12:00:00Z',
        applicationDeadline: '2026-01-25T12:00:00Z',
    };

    for (const field of ['name', 'eventLocation', 'description', 'startsAt', 'applicationDeadline',] as const) {
        for (const value of [123, true, null, [], {}]) {
            const body = {...validBody, [field]: value,};
            const result = validateEvent(body, now);
            const context = `${field} = ${JSON.stringify(value)}`;

            if (result.valid === true) {assert.fail(`${context} ska nekas.`);}
            assert.equal(result.message, 'Eventets uppgifter är ogiltiga.', `Felmeddelandet ska stämma för ${context}.`);
        }
    }
});


test('[ID: U-T9, Krav: 3.1.3 c–e, 3.1.8, 3.3.2 c–d, 3.3.3] rejects invalid dates', () => {
    const now = new Date('2026-01-01T10:00:00Z');

    const validBody = {
        name: 'Campusmässa',
        eventLocation: 'Helsingborg',
        description: 'En mässa på campus.',
        startsAt: '2026-02-01T12:00:00Z',
        applicationDeadline: '2026-01-25T12:00:00Z',
    };

    for (const field of ['startsAt', 'applicationDeadline'] as const) {
        for (const value of ['inte ett datum', '2026-13-01T12:00:00Z',]) {
            const body = {...validBody, [field]: value,};
            const result = validateEvent(body, now);
            const context = `${field} = ${JSON.stringify(value)}`;

            if (result.valid === true) {assert.fail(`${context} ska nekas.`);}
            assert.equal(result.message, 'Ange giltiga datum och tider.', `Felmeddelandet ska stämma för ${context}.`);
        }
    }
});


test('[ID: U-T10] rejects event starts in the past or at the current time', () => {
    const now = new Date('2026-01-01T10:00:00Z');

    for (const startsAt of ['2026-01-01T09:59:59Z', '2026-01-01T10:00:00Z',]) {
        const body = {
            name: 'Campusmässa',
            eventLocation: 'Helsingborg',
            description: 'En mässa på campus.',
            startsAt,
            applicationDeadline: '2025-12-31T12:00:00Z',
        };

        const result = validateEvent(body, now);
        if (result.valid === true) {assert.fail(`Starttiden ${startsAt} ska nekas.`);}
        assert.equal(result.message, 'Starten måste vara i framtiden och sista anmälan senast vid starten.');
    }
});


test('[ID: U-T11, Krav: 3.1.8] checks deadline relative to event start', () => {
    const now = new Date('2026-01-01T10:00:00Z');

    const cases = [
        {
            deadline: '2026-02-01T11:59:59Z',
            expectedValid: true,
        },
        {
            deadline: '2026-02-01T12:00:00Z',
            expectedValid: true,
        },
        {
            deadline: '2026-02-01T12:00:01Z',
            expectedValid: false,
        },
    ];

    for (const { deadline, expectedValid } of cases) {
        const body = {
            name: 'Campusmässa',
            eventLocation: 'Helsingborg',
            description: 'En mässa på campus.',
            startsAt: '2026-02-01T12:00:00Z',
            applicationDeadline: deadline,
        };

        const result = validateEvent(body, now);
        assert.equal(result.valid, expectedValid, `Deadline ${deadline}: förväntat valid = ${expectedValid}.`);
        if (result.valid === false) {
            assert.equal(result.message, 'Starten måste vara i framtiden och sista anmälan senast vid starten.');
        }
    }
});


test('[ID: U-T12, Krav: 3.1.3 a, b, f, 3.3.2 a, e, f] checks text length limits', () => {
    const now = new Date('2026-01-01T10:00:00Z');

    const validBody = {
        name: 'Campusmässa',
        eventLocation: 'Helsingborg',
        description: 'En mässa på campus.',
        startsAt: '2026-02-01T12:00:00Z',
        applicationDeadline: '2026-01-25T12:00:00Z',
    };

    const limits = [
        { field: 'name', maxLength: 200 },
        { field: 'eventLocation', maxLength: 300 },
        { field: 'description', maxLength: 5000 },
    ] as const;

    for (const { field, maxLength } of limits) {
        for (const length of [maxLength, maxLength + 1]) {
            const body = {
                ...validBody,
                [field]: 'a'.repeat(length),
            };

            const result = validateEvent(body, now);

            assert.equal(
                result.valid,
                length <= maxLength,
                `${field} med ${length} tecken gav fel resultat.`
            );

            if (result.valid === false) {
                assert.equal(
                    result.message,
                    'Kontrollera eventnamn, plats och beskrivning.'
                );
            }
        }
    }
});
