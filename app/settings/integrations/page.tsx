
import { getEtsyStatus, disconnectEtsy } from '@/app/actions/etsy';
import { getShopifyStatus, disconnectShopify } from '@/app/actions/shopify';
import { ShopifyConnect } from '@/components/ShopifyConnect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const [etsyStatus, shopifyStatus] = await Promise.all([
        getEtsyStatus(),
        getShopifyStatus()
    ]);

    const isConnected = etsyStatus.connected && !etsyStatus.isExpired;
    const isExpired = etsyStatus.connected && etsyStatus.isExpired;
    const isShopifyConnected = shopifyStatus.connected;

    const { error, etsy, shopify } = await searchParams;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/settings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
                    <p className="text-muted-foreground">Connect your accounts to publish directly.</p>
                </div>
            </div>

            {/* Error/Success Messages from Redirect */}
            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <p>Connection failed: {error}</p>
                </div>
            )}
            {etsy === 'connected' && (
                <div className="p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <p>Successfully connected to Etsy!</p>
                </div>
            )}
            {shopify === 'connected' && (
                <div className="p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <p>Successfully connected to Shopify!</p>
                </div>
            )}

            <div className="space-y-4">
                {/* Etsy Integration */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-xl bg-card gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F1641E] rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
                            E
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                Etsy
                                {isConnected && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>}
                                {isExpired && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Session Expired</span>}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isConnected
                                    ? `Connected as User ID: ${etsyStatus.userId}`
                                    : "Connect your Etsy shop to publish listings directly."}
                            </p>
                        </div>
                    </div>

                    <div className="flex-shrink-0">
                        {isConnected || isExpired ? (
                            <form action={disconnectEtsy}>
                                <Button variant="outline" className="w-full md:w-auto text-destructive hover:text-destructive">Disconnect</Button>
                            </form>
                        ) : (
                            <Button asChild className="w-full md:w-auto bg-[#F1641E] hover:bg-[#D55F21] text-white">
                                <Link href="/api/etsy/auth">Connect Etsy</Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Shopify Integration */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-xl bg-card gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#95BF47] rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
                            S
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                Shopify
                                {isShopifyConnected && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isShopifyConnected
                                    ? `Connected to ${shopifyStatus.shopDomain}`
                                    : "Connect your Shopify store using OAuth."}
                            </p>
                        </div>
                    </div>

                    <div className="flex-shrink-0">
                        {isShopifyConnected ? (
                            <form action={disconnectShopify}>
                                <Button variant="outline" className="w-full md:w-auto text-destructive hover:text-destructive">Disconnect</Button>
                            </form>
                        ) : (
                            <ShopifyConnect />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
