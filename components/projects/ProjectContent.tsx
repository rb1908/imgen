import { getProject } from '@/app/actions/projects';
import { getTemplates } from '@/app/actions/templates';
import { ProjectWorkspace } from '@/components/projects/ProjectWorkspace';
import { notFound } from 'next/navigation';

export async function ProjectContent({ id }: { id: string }) {
    // Parallel fetching for performance
    const [project, templates] = await Promise.all([
        getProject(id),
        getTemplates()
    ]);

    if (!project) notFound();

    return <ProjectWorkspace project={project} templates={templates} />;
}
