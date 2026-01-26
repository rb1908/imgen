// Force Vercel Rebuild - Timestamp: verify_upload_fix_2
'use client';

import { PageHeader } from '@/components/PageHeader';
import { PageScaffold } from '@/components/PageScaffold';
import { useState, useEffect } from 'react';
import { Project, Generation } from '@prisma/client';
import { createProject, deleteProject, updateProject, getSignedUploadUrl, getPublicUrl } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, FolderOpen, Image as ImageIcon, LayoutGrid, List, Pencil, MoreVertical, Loader2 } from 'lucide-react';
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
    initialProjects: (Project & {
        generations: { imageUrl: string, customizedImageUrl: string | null, createdAt: Date }[];
        _count: { generations: number };
    })[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
    const [projects, setProjects] = useState(initialProjects);

    useEffect(() => {
        setProjects(initialProjects);
    }, [initialProjects]);

    const router = useRouter();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Renaming State
    const [renamingProject, setRenamingProject] = useState<Project & { generations: { imageUrl: string, customizedImageUrl: string | null, createdAt: Date }[], _count: { generations: number } } | null>(null);
    const [newName, setNewName] = useState("");

    // Upload State
    const [pendingUploads, setPendingUploads] = useState<{
        id: string;
        name: string;
        previewUrl: string;
        progress: number;
        status: 'uploading' | 'error' | 'success';
    }[]>([]);

    const isUploading = pendingUploads.some(p => p.status === 'uploading');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        const newUploads = fileArray.map(file => ({
            id: `temp-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name.split('.')[0],
            previewUrl: URL.createObjectURL(file), // Immediate preview
            progress: 0,
            status: 'uploading' as const
        }));

        setPendingUploads(prev => [...prev, ...newUploads]);

        let successCount = 0;

        // Process uploads in parallel
        await Promise.all(fileArray.map(async (file, index) => {
            const pendingParams = newUploads[index];
            try {
                // 1. Get Signed URL from Server (Secure)
                const { signedUrl, path } = await getSignedUploadUrl(file.name, file.type);

                // 2. Upload with Progress via Axios
                const axios = (await import('axios')).default;

                await axios.put(signedUrl, file, {
                    headers: {
                        'Content-Type': file.type,
                        'x-upsert': 'false',
                    },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setPendingUploads(prev => prev.map(p =>
                                p.id === pendingParams.id ? { ...p, progress: percent } : p
                            ));
                        }
                    }
                });

                // 3. Get Public URL
                const publicUrl = await getPublicUrl(path);

                // 4. Create Project in DB
                const formData = new FormData();
                formData.append('imageUrl', publicUrl);
                formData.append('name', pendingParams.name);

                await createProject(formData);
                successCount++;

                // Mark complete
                setPendingUploads(prev => prev.map(p =>
                    p.id === pendingParams.id ? { ...p, progress: 100, status: 'success' } : p
                ));
                router.refresh();

                // Remove after short delay to show success state
                setTimeout(() => {
                    setPendingUploads(prev => prev.filter(p => p.id !== pendingParams.id));
                    URL.revokeObjectURL(pendingParams.previewUrl);
                }, 1000);

            } catch (err) {
                console.error(`Failed to upload ${file.name}:`, err);
                setPendingUploads(prev => prev.map(p =>
                    p.id === pendingParams.id ? { ...p, status: 'error' } : p
                ));
                toast.error(`Failed to upload ${file.name}`);
            }
        }));

        // Single Success Toast with Green Style
        if (successCount > 0) {
            toast.success(`${successCount} item${successCount > 1 ? 's' : ''} uploaded successfully`, {
                className: 'bg-green-500 text-white border-green-600',
                duration: 3000,
            });
        }

        e.target.value = '';
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

    const startRenaming = (project: Project & { generations: { imageUrl: string, customizedImageUrl: string | null, createdAt: Date }[], _count: { generations: number } }, e: React.MouseEvent) => {
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
        <PageScaffold>
            <PageHeader
                title="Projects"
            >
                <div className="relative">
                    <Button size="sm" className="gap-2 shadow-sm" disabled={isUploading}>
                        {isUploading ? <Plus className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>{isUploading ? "Uploading..." : "New"}</span>
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
            </PageHeader>

            <div className="space-y-6 p-4 md:p-8">
                {/* View Options Toolbar (Scrolls away) */}
                <div className="flex items-center justify-end gap-2 text-muted-foreground">
                    <span className="text-xs font-medium uppercase tracking-wider opacity-70 mr-auto">
                        {projects.length} Project{projects.length !== 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all hover:bg-accent ${viewMode === 'grid' ? 'text-foreground bg-accent/50' : 'text-muted-foreground'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all hover:bg-accent ${viewMode === 'list' ? 'text-foreground bg-accent/50' : 'text-muted-foreground'}`}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>

                {projects.length === 0 && pendingUploads.length === 0 ? (
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-20 md:pb-0">
                                {/* Pending Upload Cards */}
                                {pendingUploads.map((pending) => (
                                    <div key={pending.id} className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-dashed border-primary/30 shadow-sm animate-pulse">
                                        {/* Background Preview (dimmed) */}
                                        <Image
                                            src={pending.previewUrl}
                                            alt="Uploading"
                                            fill
                                            className="object-cover opacity-20 blur-sm"
                                        />

                                        {/* Foreground Progress */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-3">
                                            {pending.status === 'uploading' && (
                                                <>
                                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                    <div className="w-full max-w-[80%] space-y-1 z-10">
                                                        <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary transition-all duration-300 ease-out"
                                                                style={{ width: `${pending.progress}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-center text-muted-foreground font-mono">
                                                            {pending.progress}%
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                            {pending.status === 'success' && (
                                                <div className="flex flex-col items-center gap-1 text-green-600 z-10">
                                                    <div className="p-2 bg-green-100 rounded-full">
                                                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce" />
                                                    </div>
                                                    <span className="text-xs font-bold">Complete</span>
                                                </div>
                                            )}
                                            {pending.status === 'error' && (
                                                <div className="flex flex-col items-center gap-1 text-destructive z-10">
                                                    <span className="text-xs font-bold">Failed</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {projects.map((project) => (
                                    <Link href={`/project/${project.id}`} key={project.id} className="group relative block rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-md hover:border-primary/50 overflow-hidden">
                                        {/* Preview Grid */}
                                        <div className="aspect-video w-full bg-muted relative grid grid-cols-2 gap-[1px] bg-white/10">
                                            <div className={`relative ${project.generations.length > 0 ? 'col-span-1' : 'col-span-2'} h-full`}>
                                                <Image
                                                    src={project.originalImageUrl}
                                                    alt="Original"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            {project.generations.length > 0 && (
                                                <div className="relative h-full bg-muted/50 border-l border-white/10">
                                                    <Image
                                                        src={project.generations[0].customizedImageUrl || project.generations[0].imageUrl}
                                                        alt="Gen 1"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                                    {project._count.generations > 1 && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold text-lg">
                                                            +{project._count.generations - 1}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3 md:p-4 flex items-center justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold line-clamp-1 text-sm md:text-base">{project.name}</h3>
                                                <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                                    {project._count.generations} images
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
                            <div className="flex flex-col gap-2 pb-24 md:pb-0">
                                {/* Pending List Items */}
                                {pendingUploads.map((pending) => (
                                    <div key={pending.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card/80 transition-all shadow-sm">
                                        <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted border">
                                            <Image
                                                src={pending.previewUrl}
                                                alt="Uploading"
                                                fill
                                                className="object-cover opacity-60"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className="font-semibold text-sm truncate opacity-70">{pending.name}</h3>
                                                <span className="text-[10px] font-mono text-muted-foreground">{pending.progress}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-200 ${pending.status === 'error' ? 'bg-destructive' : pending.status === 'success' ? 'bg-green-500' : 'bg-primary'}`}
                                                    style={{ width: `${pending.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {projects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => router.push(`/project/${project.id}`)}
                                        className="group flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all cursor-pointer shadow-sm hover:border-primary/20"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted border">
                                            <Image
                                                src={project.originalImageUrl}
                                                alt="Thumbnail"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <ImageIcon className="w-3 h-3" />
                                                    {project._count.generations}
                                                </span>
                                                <span className="w-0.5 h-0.5 rounded-full bg-zinc-300" />
                                                <span>
                                                    {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <div className="md:hidden">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => startRenaming(project, e as any)}>
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => handleDelete(project.id, e as any)} className="text-destructive">
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => startRenaming(project, e)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(project.id, e)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

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
        </PageScaffold>
    );
}
