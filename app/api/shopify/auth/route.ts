import { NextRequest, NextResponse } from 'next/server';
import { SHOPIFY_SCOPES, validateShopDomain } from '@/lib/shopify';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    let shop = searchParams.get('shop');

    if (!shop) {
        return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Normalize shop domain
    if (!shop.endsWith('.myshopify.com')) {
        shop += '.myshopify.com';
    }

    if (!validateShopDomain(shop)) {
        return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    // const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/shopify/callback`;
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/shopify/callback`;

    // Nonce for security (optional but recommended)
    const nonce = Math.random().toString(36).substring(7);

    // https://{shop}.myshopify.com/admin/oauth/authorize?client_id={api_key}&scope={scopes}&redirect_uri={redirect_uri}&state={nonce}&grant_options[]={access_mode}
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${SHOPIFY_SCOPES}&redirect_uri=${redirectUri}&state=${nonce}`;

    return NextResponse.redirect(authUrl);
}
