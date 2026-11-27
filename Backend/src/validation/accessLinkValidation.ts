
//Validation for links used in registerRoutes.ts, participantRoutes and tested in accessLink.test.ts

type AccessLinkDates = {
    expires_at: Date;
    revoked_at: Date | null;
};

export function calculateAccessLinkExpiry(startsAt: Date): Date {
    return new Date(
        startsAt.getTime() + 7 * 24 * 60 * 60 * 1000
    );
}

export function isValidAccessToken(token: string): boolean {
    return /^[a-f0-9]{64}$/.test(token);
}

export function isAccessLinkExpired(
    link: AccessLinkDates,
    now: Date
): boolean {
    return link.revoked_at !== null || link.expires_at <= now;
}