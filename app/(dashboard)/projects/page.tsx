import { Suspense } from 'react';
import { ProjectsContent } from '@/components/ProjectsContent';
import { DashboardSkeleton } from '@/components/Loaders';


export default function ProjectsPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <ProjectsContent />
        </Suspense>
    );
}
