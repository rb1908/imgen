// Force Vercel Rebuild - Timestamp: verify_upload_fix
'use client';

import { useState } from 'react';
import { Project, Generation } from '@prisma/client';
import { createProject, deleteProject, updateProject } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, FolderOpen, Image as ImageIcon, LayoutGrid, List, Pencil, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectListProps {
    initialProjects: (Project & { generations: Generation[] })[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Renaming State
    const [renamingProject, setRenamingProject] = useState<Project & { generations: Generation[] } | null>(null);
    const [newName, setNewName] = useState("");

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const fileArray = Array.from(files);
        let successCount = 0;
        let failCount = 0;

        try {
            // Initialize Client (Client-side safe)
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            // Process uploads in parallel
            await Promise.all(fileArray.map(async (file) => {
                try {
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
                    formData.append('name', file.name.split('.')[0]); // Use filename without extension as project name

                    await createProject(formData);
                    successCount++;
                } catch (err) {
                    console.error(`Failed to upload ${file.name}:`, err);
                    failCount++;
                }
            }));

            if (successCount > 0) {
                toast.success(`${successCount} project${successCount > 1 ? 's' : ''} created successfully`);
                // If it was just one, redirect to it? Or just stay on list?
                // For bulk, staying on list makes more sense so they can see them all.
                // But if it was just one, maybe redirect? 
                // Let's rely on standard list refresh (router.refresh called by createProject revalidatePath).
                // But createProject uses revalidatePath, so the list should update.
                // However, I previously had router.push for single upload.
                // Let's decide: if 1 file, redirect. If >1, stay.
                if (fileArray.length === 1 && successCount === 1) {
                    // We need the ID to redirect. 
                    // Since I'm doing Promise.all, capturing the ID of the single one is tricky without changing the structure.
                    // I'll stick to staying on the dashboard for now for consistency, or refresh.
                    router.refresh();
                } else {
                    router.refresh();
                }
            }

            if (failCount > 0) {
                toast.error(`Failed to create ${failCount} project${failCount > 1 ? 's' : ''}`);
            }

        } catch (error: any) {
            console.error(error);
            toast.error("Batch upload encountered errors");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation(); // Ensure we don't trigger row clicks in list mode
        if (!confirm("Delete this project and all its generations?")) return;

        try {
            await deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            toast.success("Project deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const startRenaming = (project: Project & { generations: Generation[] }, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setRenamingProject(project);
        setNewName(project.name || "");
    };

    const handleRenameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renamingProject) return;
        if (!newName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        try {
            const updated = await updateProject(renamingProject.id, newName);
            setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, name: updated.name } : p));
            toast.success("Project renamed");
            setRenamingProject(null);
        } catch (error) {
            toast.error("Failed to rename project");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-10 px-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ImageForge Projects</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Manage your creative workspaces.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="flex items-center p-1 bg-muted rounded-lg border">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative">
                        <Button size="lg" className="gap-2 shadow-lg hover:shadow-primary/20 transition-all" disabled={isUploading}>
                            {isUploading ? <Plus className="animate-spin" /> : <Plus />}
                            <span className="hidden md:inline">{isUploading ? "Creating..." : "New Project"}</span>
                            <span className="md:hidden">{isUploading ? "..." : "New"}</span>
                        </Button>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </div>
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
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
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

                                    <div className="p-3 md:p-4 flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold line-clamp-1 text-sm md:text-base">{project.name}</h3>
                                            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                                {project.generations.length} generations
                                            </p>
                                        </div>

                                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => startRenaming(project, e as any)}>
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => handleDelete(project.id, e as any)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border shadow-sm overflow-hidden bg-card">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="py-2 px-4 w-[60px] text-left">Preview</th>
                                        <th className="py-2 px-4 text-left">Name</th>
                                        <th className="py-2 px-4 hidden sm:table-cell text-left">Created</th>
                                        <th className="py-2 px-4 text-right">Count</th>
                                        <th className="py-2 px-4 w-[100px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {projects.map((project) => (
                                        <tr
                                            key={project.id}
                                            className="group hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/project/${project.id}`)}
                                        >
                                            {/* Thumbnail */}
                                            <td className="p-2 pl-4">
                                                <div className="w-8 h-8 relative rounded-md overflow-hidden bg-muted border">
                                                    <Image
                                                        src={project.originalImageUrl}
                                                        alt="Thumbnail"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </td>

                                            {/* Name */}
                                            <td className="p-2 px-4 font-medium">
                                                {project.name}
                                            </td>

                                            {/* Date */}
                                            <td className="p-2 px-4 text-muted-foreground hidden sm:table-cell">
                                                {new Date(project.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>

                                            {/* Stats */}
                                            <td className="p-2 px-4 text-right font-medium tabular-nums text-muted-foreground">
                                                {project.generations.length}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-2 pr-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={(e) => startRenaming(project, e)}
                                                        title="Rename Project"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => handleDelete(project.id, e)}
                                                        title="Delete Project"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            <Dialog open={!!renamingProject} onOpenChange={(open) => !open && setRenamingProject(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Project</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRenameSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">Project Name</Label>
                            <Input
                                id="project-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Enter project name"
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRenamingProject(null)}>
                                Cancel
                            </Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
