import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const appId = process.env.FACEBOOK_APP_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/instagram/callback`;

    // Scopes needed for Instagram Graph API (Business Posts)
    const scopes = [
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',      // To find the page linked to IG
        'pages_read_engagement' // Often needed alongside show_list
    ].join(',');

    // State to prevent CSRF (Adding a simple timestamp or random string for now)
    const state = Math.random().toString(36).substring(7);

    if (!appId) {
        return NextResponse.json({ error: 'Missing FACEBOOK_APP_ID' }, { status: 500 });
    }

    // Facebook Login Dialog URL
    const facebookLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes}&response_type=code`;

    return NextResponse.redirect(facebookLoginUrl);
}
