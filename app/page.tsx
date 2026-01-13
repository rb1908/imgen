import { getProjects } from '@/app/actions/projects';
import { ProjectList } from "@/components/ProjectList";

export const dynamic = 'force-dynamic';

export default async function Home() {
    const projects = await getProjects();

    return <ProjectList initialProjects={projects} />;
}
