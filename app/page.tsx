import { getProjects } from '@/app/actions/projects';
import { ProjectList } from '@/components/ProjectList';

export default async function Home() {
    const projects = await getProjects();

    return <ProjectList initialProjects={projects} />;
}
