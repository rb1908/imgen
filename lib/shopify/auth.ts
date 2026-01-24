import crypto from 'crypto';

export const SHOPIFY_SCOPES = 'read_products,write_products,read_orders'; // Basic scopes, adjust as needed

// Verify HMAC for security
export function verifyHmac(query: { [key: string]: string }, secret: string): boolean {
    const { hmac, ...params } = query;
    if (!hmac) return false;

    // Sort keys
    const orderedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
        }, {} as { [key: string]: string });

    const message = new URLSearchParams(orderedParams).toString();
    const generatedHmac = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(generatedHmac),
        Buffer.from(hmac)
    );
}

export function validateShopDomain(shop: string): boolean {
    // Regex to validate myshopify.com domain
    return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}
