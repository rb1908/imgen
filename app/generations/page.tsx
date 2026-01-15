import { Suspense } from 'react';
import { GenerationsContent } from '@/components/GenerationsContent';
import { TemplateSkeleton } from '@/components/TemplateSkeleton';

export const dynamic = 'force-dynamic';

export default function GenerationsPage() {
    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 h-full overflow-y-auto">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
                <p className="text-muted-foreground text-sm">Your complete creative history</p>
            </div>

            <Suspense fallback={<TemplateSkeleton />}>
                <GenerationsContent />
            </Suspense>
        </div>
    );
}

