import { Suspense } from 'react';
import { GenerationsContent } from '@/components/GenerationsContent';
import { TemplateSkeleton } from '@/components/TemplateSkeleton';

export const dynamic = 'force-dynamic';

export default function GenerationsPage() {
    return (
        <div className="max-w-6xl mx-auto py-10 px-4 space-y-8 h-full overflow-y-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Global Feed</h1>
                <p className="text-muted-foreground">All variations generated across all projects, sorted by newest.</p>
            </div>

            <Suspense fallback={<TemplateSkeleton />}>
                <GenerationsContent />
            </Suspense>
        </div>
    );
}

