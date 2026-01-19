import { NextRequest, NextResponse } from 'next/server';
import { verifyHmac } from '@/lib/shopify';
import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    const hmac = searchParams.get('hmac');

    if (!shop || !code || !hmac) {
        return NextResponse.redirect(new URL('/settings?error=missing_shopify_params', request.url));
    }

    // Verify HMAC
    const query = Object.fromEntries(searchParams.entries());
    const isValid = verifyHmac(query, process.env.SHOPIFY_API_SECRET || '');

    if (!isValid) {
        return NextResponse.redirect(new URL('/settings?error=invalid_hmac', request.url));
    }

    try {
        // Exchange code for access token
        const accessTokenUrl = `https://${shop}/admin/oauth/access_token`;
        const payload = {
            client_id: process.env.SHOPIFY_API_KEY,
            client_secret: process.env.SHOPIFY_API_SECRET,
            code: code,
        };

        const response = await fetch(accessTokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('Shopify Token Error:', await response.text());
            return NextResponse.redirect(new URL('/settings?error=shopify_token_failed', request.url));
        }

        const data = await response.json();
        const accessToken = data.access_token;
        const scopes = data.scope;

        // Store in DB
        // Upsert based on shop domain
        const { userId } = await auth();

        await prisma.shopifyIntegration.upsert({
            where: { shopDomain: shop },
            update: {
                accessToken,
                scopes,
                userId // Update owner if needed
            },
            create: {
                shopDomain: shop,
                accessToken,
                scopes,
                userId
            }
        });

        return NextResponse.redirect(new URL('/settings?shopify=connected', request.url));

    } catch (e) {
        console.error("Shopify Callback Exception:", e);
        return NextResponse.redirect(new URL('/settings?error=shopify_exception', request.url));
    }
}
