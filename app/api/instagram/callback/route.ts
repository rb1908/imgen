import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Get current user
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error || !code) {
        return NextResponse.json({ error: error || 'No code provided' }, { status: 400 });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/instagram/callback`;

    if (!appId || !appSecret) {
        return NextResponse.json({ error: 'Missing Credentials' }, { status: 500 });
    }

    try {
        // 1. Exchange Code for Short-Lived User Access Token
        const tokenResponse = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
        );
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            throw new Error(tokenData.error.message);
        }

        const shortLivedAccessToken = tokenData.access_token;

        // 2. Exchange Short-Lived Token for Long-Lived Token (60 days)
        const longLivedResponse = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedAccessToken}`
        );
        const longLivedData = await longLivedResponse.json();

        const accessToken = longLivedData.access_token || shortLivedAccessToken; // Fallback if exchange fails but we have short term

        // 3. Get User's Pages to find the connected Instagram Account
        // We need the Page ID that has an Instagram Business Account linked
        const pagesResponse = await fetch(
            `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account{id,username}`
        );
        const pagesData = await pagesResponse.json();

        // Find the first page with an Instagram Business Account
        const pageWithIg = pagesData.data?.find((p: any) => p.instagram_business_account);

        if (!pageWithIg) {
            return NextResponse.redirect(`${baseUrl}/settings?error=no_instagram_account_linked`);
        }

        const instagramId = pageWithIg.instagram_business_account.id;
        const pageId = pageWithIg.id;
        const pageName = pageWithIg.name;
        // Sometimes username isn't in this field depending on permission, but let's try
        const username = pageWithIg.instagram_business_account.username || 'Linked Account';

        // 4. Save to Database
        // Upsert based on instagramId or userId? 
        // Let's assume one IG account per user for now, or just create new. 
        // Better to allow multiple? For MVP, one per user.

        // Check if existing integration for this user
        const existing = await prisma.instagramIntegration.findFirst({
            where: { userId }
        });

        if (existing) {
            await prisma.instagramIntegration.update({
                where: { id: existing.id },
                data: {
                    accessToken,
                    instagramId,
                    pageId,
                    pageName,
                    username,
                    updatedAt: new Date()
                }
            });
        } else {
            await prisma.instagramIntegration.create({
                data: {
                    userId,
                    accessToken,
                    instagramId,
                    pageId,
                    pageName,
                    username
                }
            });
        }

        // Redirect back to settings or studio
        return NextResponse.redirect(`${baseUrl}/settings?success=instagram_connected`);

    } catch (err: any) {
        console.error('Instagram Auth Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
