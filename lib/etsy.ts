import { createHash, randomBytes } from 'crypto';

export const ETSY_SCOPES = [
    'listings_r',
    'listings_w',
    'shops_r',
    'shops_w',
    'profile_r'
];

export const ETSY_AUTH_URL = 'https://www.etsy.com/oauth/connect';
export const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';

// PKCE Helpers

function base64URLEncode(str: Buffer): string {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
    return base64URLEncode(randomBytes(32));
}

export function generateCodeChallenge(verifier: string): string {
    const hash = createHash('sha256').update(verifier).digest();
    return base64URLEncode(hash);
}

export function generateState(): string {
    return base64URLEncode(randomBytes(16));
}
