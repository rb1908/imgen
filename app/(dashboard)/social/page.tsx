'use client';

import { useState } from 'react';
import { PageScaffold } from '@/components/PageScaffold';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Download, Save } from 'lucide-react';
import { SocialCanvas } from '@/components/social/SocialCanvas';
import { SocialControls } from '@/components/social/SocialControls';

export default function SocialStudioPage() {
    const [format, setFormat] = useState<'square' | 'story' | 'og'>('square');
    const [overlays, setOverlays] = useState<any[]>([]);
    const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined);

    const handleAddText = () => {
        setOverlays([...overlays, { type: 'text', content: 'New Text', x: 50, y: 50 }]);
    };

    const handleSelectAsset = () => {
        // Placeholder for asset picker dialog
        setBackgroundImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop');
    };

    return (
        <PageScaffold>
            <div className="flex flex-col h-full bg-background overflow-hidden relative">
                <PageHeader
                    title="Social Studio"
                    description="Create thumb-stopping social content."
                >
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Save className="w-4 h-4" />
                            Save Draft
                        </Button>
                        <Button size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </PageHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Canvas Area */}
                    <div className="flex-1 relative z-0">
                        <SocialCanvas
                            format={format}
                            backgroundColor="#f5f5f5"
                            backgroundImage={backgroundImage}
                            overlays={overlays}
                            onDrop={() => { }}
                        />
                    </div>

                    {/* Right Controls */}
                    <SocialControls
                        format={format}
                        setFormat={setFormat}
                        onAddText={handleAddText}
                        onSelectAsset={handleSelectAsset}
                    />
                </div>
            </div>
        </PageScaffold>
    );
}
