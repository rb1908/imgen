import { NextRequest, NextResponse } from 'next/server';
import { generateCodeChallenge, generateCodeVerifier, generateState, ETSY_AUTH_URL, ETSY_SCOPES } from '@/lib/etsy';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const clientId = process.env.ETSY_API_KEY_STRING;
    // const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/etsy/callback`; 
    // Fallback if env not set for local dev
    // We'll trust the host header or hardcode for dev if needed, but best is env.

    // For local dev, hardcoding usually works better to avoid mismatch if env is missing
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/etsy/callback`;

    if (!clientId) {
        return NextResponse.json({ error: 'Missing ETSY_API_KEY_STRING' }, { status: 500 });
    }

    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    const state = generateState();

    // Store verifier and state in cookie for callback verification
    const cookieStore = await cookies();

    // Secure cookies (httpOnly)
    cookieStore.set('etsy_oauth_verifier', verifier, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 300 }); // 5 min
    cookieStore.set('etsy_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 300 });

    // Construct Auth URL
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: ETSY_SCOPES.join(' '),
        state: state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
    });

    const url = `${ETSY_AUTH_URL}?${params.toString()}`;

    return NextResponse.redirect(url);
}
