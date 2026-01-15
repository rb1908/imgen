import { Suspense } from 'react';
import { ProjectContent } from '@/components/ProjectContent';
import { ProjectSkeleton } from '@/components/Loaders';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <Suspense fallback={<ProjectSkeleton />}>
            <ProjectContent id={id} />
        </Suspense>
    );
}
