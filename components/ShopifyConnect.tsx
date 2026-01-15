'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ShopifyConnect() {
    const [shopUrl, setShopUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = () => {
        if (!shopUrl) return;

        // Basic validation
        let cleanUrl = shopUrl.replace('https://', '').replace('http://', '').replace('/', '');
        if (!cleanUrl.includes('.')) {
            // Assume they typed just the name, append myshopify.com
            cleanUrl += '.myshopify.com';
        }

        if (!cleanUrl.endsWith('.myshopify.com')) {
            toast.error("Please enter a valid .myshopify.com domain");
            return;
        }

        setIsLoading(true);
        // Redirect to auth endpoint
        window.location.href = `/api/shopify/auth?shop=${cleanUrl}`;
    };

    return (
        <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
                type="text"
                placeholder="my-store.myshopify.com"
                value={shopUrl}
                onChange={(e) => setShopUrl(e.target.value)}
                disabled={isLoading}
            />
            <Button onClick={handleConnect} disabled={isLoading || !shopUrl} className="bg-[#95BF47] hover:bg-[#7DAC3B]">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
            </Button>
        </div>
    );
}
