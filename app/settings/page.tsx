import { getEtsyStatus, disconnectEtsy } from '@/app/actions/etsy';
import { getShopifyStatus, disconnectShopify } from '@/app/actions/shopify';
import { ShopifyConnect } from '@/components/ShopifyConnect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { TemplatesContent } from '@/components/TemplatesContent';
import { TemplateSkeleton } from '@/components/TemplateSkeleton';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const [etsyStatus, shopifyStatus] = await Promise.all([
        getEtsyStatus(),
        getShopifyStatus()
    ]);

    const isConnected = etsyStatus.connected && !etsyStatus.isExpired;
    const isExpired = etsyStatus.connected && etsyStatus.isExpired;

    const isShopifyConnected = shopifyStatus.connected;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <Tabs defaultValue="integrations" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    <TabsTrigger value="looks">Looks (Templates)</TabsTrigger>
                </TabsList>

                <TabsContent value="integrations" className="space-y-4">
                    {/* Integrations Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Integrations</CardTitle>
                            <CardDescription>Connect your accounts to publish directly.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Etsy Integration */}
                            <div className="flex items-center justify-between p-4 border rounded-xl bg-card">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#F1641E] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                        E
                                    </div>
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2">
                                            Etsy
                                            {isConnected && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>}
                                            {isExpired && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Session Expired</span>}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isConnected
                                                ? `Connected as User ID: ${etsyStatus.userId}`
                                                : "Connect your Etsy shop to publish listings directly."}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    {isConnected || isExpired ? (
                                        <form action={disconnectEtsy}>
                                            <Button variant="outline" className="text-destructive hover:text-destructive">Disconnect</Button>
                                        </form>
                                    ) : (
                                        <Button asChild className="bg-[#F1641E] hover:bg-[#D55F21] text-white">
                                            <Link href="/api/etsy/auth">Connect Etsy</Link>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Shopify Integration */}
                            <div className="flex items-center justify-between p-4 border rounded-xl bg-card">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#95BF47] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                        S
                                    </div>
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2">
                                            Shopify
                                            {isShopifyConnected && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isShopifyConnected
                                                ? `Connected to ${shopifyStatus.shopDomain}`
                                                : "Connect your Shopify store using OAuth."}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    {isShopifyConnected ? (
                                        <form action={disconnectShopify}>
                                            <Button variant="outline" className="text-destructive hover:text-destructive">Disconnect</Button>
                                        </form>
                                    ) : (
                                        <ShopifyConnect />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Error/Success Messages from Redirect */}
                    {searchParams?.error && (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            <p>Connection failed: {searchParams.error}</p>
                        </div>
                    )}
                    {searchParams?.etsy === 'connected' && (
                        <div className="p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            <p>Successfully connected to Etsy!</p>
                        </div>
                    )}
                    {searchParams?.shopify === 'connected' && (
                        <div className="p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            <p>Successfully connected to Shopify!</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="looks">
                    <Card>
                        <CardHeader>
                            <CardTitle>Saved Looks</CardTitle>
                            <CardDescription>Manage your generation templates and styles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<TemplateSkeleton />}>
                                <TemplatesContent />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
