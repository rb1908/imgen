import { Suspense } from 'react';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectsContent } from '@/components/projects/ProjectsContent';
import { DashboardSkeleton } from '@/components/Loaders';


export default function ProjectsPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <ProjectsContent />
        </Suspense>
    );
}
