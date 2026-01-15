import { Suspense } from 'react';
import { ProjectsContent } from '@/components/ProjectsContent';
import { DashboardSkeleton } from '@/components/Loaders';

export const dynamic = 'force-dynamic';

export default function Home() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <ProjectsContent />
        </Suspense>
    );
}
