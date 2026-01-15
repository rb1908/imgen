import { Suspense } from 'react';
import { GenerationsContent } from '@/components/GenerationsContent';
import { TemplateSkeleton } from '@/components/TemplateSkeleton';
import { SearchInput } from '@/components/SearchInput';

export const dynamic = 'force-dynamic';

export default function GenerationsPage({ searchParams }: { searchParams: { q?: string } }) {
    const query = searchParams?.q || '';

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 h-full overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
                    <p className="text-muted-foreground text-sm">Your complete creative history</p>
                </div>
                <SearchInput placeholder="Search looks..." />
            </div>

            <Suspense fallback={<TemplateSkeleton />}>
                <GenerationsContent query={query} />
            </Suspense>
        </div>
    );
}

