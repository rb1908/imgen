import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { ETSY_TOKEN_URL } from '@/lib/etsy';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL(`/settings?error=${error}`, request.url));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL('/settings?error=missing_params', request.url));
    }

    const cookieStore = await cookies();
    const verifier = cookieStore.get('etsy_oauth_verifier')?.value;
    const storedState = cookieStore.get('etsy_oauth_state')?.value;

    if (!verifier || !storedState || state !== storedState) {
        return NextResponse.redirect(new URL('/settings?error=invalid_state', request.url));
    }

    const clientId = process.env.ETSY_API_KEY_STRING;
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/etsy/callback`;

    try {
        // Exchange code for token
        const response = await fetch(ETSY_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId!,
                redirect_uri: redirectUri,
                code: code,
                code_verifier: verifier,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Etsy Token Error:', errorData);
            return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', request.url));
        }

        const data = await response.json();

        // data: { access_token, token_type, expires_in, refresh_token }
        // The access_token is prefixed with numeric id: "12345.tokenstring"

        const [userIdPrefix] = data.access_token.split('.');
        const expiresAt = new Date(Date.now() + data.expires_in * 1000);

        // Store in DB
        // Assuming single integration for now. If table has rows, update/replace the first one or create new.
        // Or if we can find by etsyUserId, update that.
        // For simplicity in this single-workspace app:

        // Check if one exists
        const { userId } = await auth();
        const existing = await prisma.etsyIntegration.findFirst();

        if (existing) {
            await prisma.etsyIntegration.update({
                where: { id: existing.id },
                data: {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresIn: data.expires_in,
                    expiresAt: expiresAt,
                    etsyUserId: userIdPrefix,
                    userId // Ensure ownership is set/updated
                }
            });
        } else {
            // userId already fetched above
            await prisma.etsyIntegration.create({
                data: {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresIn: data.expires_in,
                    expiresAt: expiresAt,
                    etsyUserId: userIdPrefix,
                    userId
                }
            });
        }

        // Clean cookies
        cookieStore.delete('etsy_oauth_verifier');
        cookieStore.delete('etsy_oauth_state');

        return NextResponse.redirect(new URL('/settings?etsy=connected', request.url));

    } catch (e) {
        console.error("Etsy Callback Exception:", e);
        return NextResponse.redirect(new URL('/settings?error=exception', request.url));
    }
}
