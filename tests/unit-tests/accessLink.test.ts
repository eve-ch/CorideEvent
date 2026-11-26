import { test } from 'node:test';
import assert from 'node:assert/strict';
import {calculateAccessLinkExpiry, isValidAccessToken, isAccessLinkExpired,} from '../../Backend/src/validation/accessLinkValidation';


test('[ID: U-T13, Krav: 3.4.9] expires seven days after event start', () => {
    const startsAt = new Date('2026-02-01T12:00:00Z');
    const expiresAt = calculateAccessLinkExpiry(startsAt);
    assert.equal(expiresAt.toISOString(), '2026-02-08T12:00:00.000Z');
});


test('[ID: U-T14] checks access token format', () => {
    const cases = [
        { token: '0123456789abcdef'.repeat(4), expected: true },
        { token: '', expected: false },
        { token: 'a'.repeat(63), expected: false },
        { token: 'a'.repeat(65), expected: false },
        { token: 'g'.repeat(64), expected: false },
        { token: 'A'.repeat(64), expected: false },
        { token: ' '.repeat(64), expected: false },
    ];

    for (const { token, expected } of cases) {
        assert.equal(isValidAccessToken(token), expected, `Fel resultat för token ${JSON.stringify(token)}.`);
    }
});


test('[ID: U-T15, Krav: 3.4.9] checks access link expiry boundary', () => {
    const link = {expires_at: new Date('2026-02-08T12:00:00Z'), revoked_at: null,};

    const cases = [
        { now: '2026-02-08T11:59:59.999Z', expected: false },
        { now: '2026-02-08T12:00:00.000Z', expected: true },
        { now: '2026-02-08T12:00:00.001Z', expected: true },
    ];
    for (const { now, expected } of cases) {
        assert.equal(isAccessLinkExpired(link, new Date(now)), expected, `Fel resultat vid tidpunkten ${now}.`);
    }
});


test('[ID: U-T16] rejects a revoked access link before expiry', () => {
    const now = new Date('2026-02-02T12:00:00Z');
    const link = {expires_at: new Date('2026-02-08T12:00:00Z'), revoked_at: new Date('2026-02-02T11:00:00Z'),};
    assert.equal(isAccessLinkExpired(link, now), true);
});