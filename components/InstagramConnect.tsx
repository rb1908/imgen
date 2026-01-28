'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Instagram } from 'lucide-react';

interface InstagramConnectProps {
    isConnected?: boolean;
    username?: string;
    onDisconnect?: () => void;
}

export function InstagramConnect({ isConnected, username, onDisconnect }: InstagramConnectProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = () => {
        setIsLoading(true);
        window.location.href = '/api/instagram/auth';
    };

    if (isConnected) {
        return (
            <div className="flex items-center justify-between p-4 border rounded-xl bg-gradient-to-r from-pink-50 to-orange-50 border-pink-100">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full shadow-sm text-pink-600">
                        <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-medium text-zinc-900">Connected to Instagram</p>
                        <p className="text-sm text-zinc-500">@{username || 'account'}</p>
                    </div>
                </div>
                {onDisconnect && (
                    <Button variant="outline" size="sm" onClick={onDisconnect} className="bg-white hover:bg-zinc-50">
                        Disconnect
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-4 border rounded-xl border-zinc-200">
            <div className="flex items-center gap-3">
                <div className="bg-zinc-100 p-2 rounded-full text-zinc-500">
                    <Instagram className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-medium text-zinc-900">Connect Instagram</p>
                    <p className="text-sm text-zinc-500">Post directly to your business account</p>
                </div>
            </div>
            <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white border-0"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
            </Button>
        </div>
    );
}
