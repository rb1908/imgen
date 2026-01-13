import { getProject } from '@/app/actions/projects';
import { getTemplates } from '@/app/actions/templates';
import { ProjectWorkspace } from '@/components/ProjectWorkspace';
import { notFound } from 'next/navigation';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await getProject(id);
    const templates = await getTemplates();

    if (!project) notFound();

    return <ProjectWorkspace project={project} templates={templates} />;
}
