import { Suspense } from 'react';
import { GenerationsContent } from '@/components/GenerationsContent';
import { TemplateSkeleton } from '@/components/TemplateSkeleton';
import { SearchInput } from '@/components/SearchInput';

export const dynamic = 'force-dynamic';

export default function GenerationsPage({ searchParams }: { searchParams: { q?: string } }) {
    const query = searchParams?.q || '';

    return (
        <Suspense fallback={<TemplateSkeleton />}>
            <GenerationsContent query={query} />
        </Suspense>
    );
}

