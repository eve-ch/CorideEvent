import { createHash } from 'node:crypto';

export function isValidToken(token: string): boolean {
    return /^[a-f0-9]{64}$/.test(token);
}

export function hashToken(token: string): string {
    return createHash('sha256')
        .update(token)
        .digest('hex');
}