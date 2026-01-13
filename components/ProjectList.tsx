'use client';

import { useState } from 'react';
import { Project, Generation } from '@prisma/client';
import { createProject, deleteProject } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, FolderOpen, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

interface ProjectListProps {
    initialProjects: (Project & { generations: Generation[] })[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            // Initialize Client (Client-side safe)
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

            // SDK Upload
            const { data, error } = await supabase.storage
                .from('images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            // Save to DB
            const formData = new FormData();
            formData.append('imageUrl', publicUrl);
            formData.append('name', file.name);

            const newProject = await createProject(formData);

            toast.success("Project created! Redirecting...");
            router.push(`/project/${newProject.id}`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to create project");
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        if (!confirm("Delete this project and all its generations?")) return;

        try {
            await deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            toast.success("Project deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-10 px-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">ImageForge Projects</h1>
                    <p className="text-muted-foreground mt-2">Manage your creative workspaces. Each upload is a new project.</p>
                </div>
                <div className="relative">
                    <Button size="lg" className="gap-2 shadow-lg hover:shadow-primary/20 transition-all" disabled={isUploading}>
                        {isUploading ? <Plus className="animate-spin" /> : <Plus />}
                        {isUploading ? "Creating..." : "New Project"}
                    </Button>
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No Projects Yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">Upload an image to start a new generation project.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link href={`/project/${project.id}`} key={project.id} className="group relative block rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-md hover:border-primary/50 overflow-hidden">
                            {/* Preview Grid */}
                            <div className="aspect-video w-full bg-muted relative grid grid-cols-2 gap-[1px] bg-white/10">
                                {/* Original Image (Always visible on left or full if no gens) */}
                                <div className={`relative ${project.generations.length > 0 ? 'col-span-1' : 'col-span-2'} h-full`}>
                                    <Image
                                        src={project.originalImageUrl}
                                        alt="Original"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                                        ORIGINAL
                                    </div>
                                </div>

                                {/* 1st Generation Preview or Placeholder */}
                                {project.generations.length > 0 && (
                                    <div className="relative h-full bg-muted/50 border-l border-white/10">
                                        <Image
                                            src={project.generations[0].imageUrl}
                                            alt="Gen 1"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                        {project.generations.length > 1 && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold text-lg">
                                                +{project.generations.length - 1}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold line-clamp-1">{project.name}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(project.createdAt).toLocaleDateString('en-US')} • {project.generations.length} generations
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                    onClick={(e) => handleDelete(project.id, e)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
