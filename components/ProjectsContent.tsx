import { getProjects } from '@/app/actions/projects';
import { ProjectList } from '@/components/ProjectList';

export async function ProjectsContent() {
    const projects = await getProjects();
    return <ProjectList initialProjects={projects} />;
}
