// Force Vercel Rebuild - Timestamp: verify_upload_fix
'use client';

import { PageScaffold } from '@/components/PageScaffold';
import { useState, useEffect } from 'react';
import { Project, Generation } from '@prisma/client';
import { createProject, deleteProject, updateProject, getSignedUploadUrl, getPublicUrl } from '@/app/actions/projects';
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
    initialProjects: (Project & {
        generations: { imageUrl: string, createdAt: Date }[];
        _count: { generations: number };
    })[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
    const [projects, setProjects] = useState(initialProjects);

    useEffect(() => {
        setProjects(initialProjects);
    }, [initialProjects]);

    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Renaming State
    // Renaming State
    const [renamingProject, setRenamingProject] = useState<Project & { generations: { imageUrl: string, createdAt: Date }[], _count: { generations: number } } | null>(null);
    const [newName, setNewName] = useState("");

    // Upload State
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

    // ...

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const fileArray = Array.from(files);
        setUploadingFiles(fileArray.map(f => f.name));
        setUploadProgress({}); // Reset

        let successCount = 0;
        let failCount = 0;

        try {
            // Process uploads in parallel
            await Promise.all(fileArray.map(async (file) => {
                try {
                    // 1. Get Signed URL from Server (Secure)
                    const { signedUrl, path } = await getSignedUploadUrl(file.name, file.type);

                    // 2. Upload with Progress via Axios
                    const axios = (await import('axios')).default;

                    await axios.put(signedUrl, file, {
                        headers: {
                            'Content-Type': file.type,
                            'x-upsert': 'false',
                            // Note: Supabase sometimes requires strict Content-Type match
                        },
                        onUploadProgress: (progressEvent) => {
                            if (progressEvent.total) {
                                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                setUploadProgress(prev => ({ ...prev, [file.name]: percent }));
                            }
                        }
                    });

                    // 3. Get Public URL (via server helper or client)
                    const publicUrl = await getPublicUrl(path);

                    // 4. Create Project in DB
                    const formData = new FormData();
                    formData.append('imageUrl', publicUrl);
                    formData.append('name', file.name.split('.')[0]);

                    await createProject(formData);
                    successCount++;

                    // Mark complete in progress (100%)
                    setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

                } catch (err) {
                    console.error(`Failed to upload ${file.name}:`, err);
                    failCount++;
                    // Mark as error (-1)
                    setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
                }
            }));

            if (successCount > 0) {
                toast.success(`${successCount} project${successCount > 1 ? 's' : ''} created`);
                router.refresh();
            }
            if (failCount > 0) {
                toast.error(`${failCount} failed`);
            }

        } catch (error: any) {
            console.error(error);
            toast.error("Batch upload encountered errors");
        } finally {
            // Delay clearing so user sees 100%
            setTimeout(() => {
                setIsUploading(false);
                setUploadingFiles([]);
                setUploadProgress({});
            }, 2000);
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

    const startRenaming = (project: Project & { generations: { imageUrl: string, createdAt: Date }[], _count: { generations: number } }, e: React.MouseEvent) => {
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
            <div className="space-y-6">
                <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-2 -my-2 md:static md:bg-transparent md:p-0 md:m-0">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
                        <p className="text-muted-foreground text-sm">Your images & product sets</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center p-0.5 bg-muted/50 rounded-lg border">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                title="List View"
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="relative">
                            <Button size="sm" className="gap-2 shadow-sm" disabled={isUploading}>
                                {isUploading ? <Plus className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                <span>{isUploading ? "Creating..." : "New"}</span>
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
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 pb-24 md:pb-0">
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
                                                        src={project.generations[0].imageUrl}
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
                            <div className="rounded-xl border shadow-sm overflow-hidden bg-card pb-24 md:pb-0">
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
                                                {/* Table Content (Same as before) */}
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
                                                <td className="p-2 px-4 font-medium">{project.name}</td>
                                                <td className="p-2 px-4 text-muted-foreground hidden sm:table-cell">
                                                    {new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="p-2 px-4 text-right font-medium tabular-nums text-muted-foreground">{project._count.generations}</td>
                                                <td className="p-2 pr-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => startRenaming(project, e)}><Pencil className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(project.id, e)}><Trash2 className="w-4 h-4" /></Button>
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

            {/* Upload Progress Overlay */}
            {isUploading && uploadingFiles.length > 0 && (
                <div className="fixed bottom-20 right-4 left-4 md:left-auto md:bottom-4 z-50 md:w-80 w-auto bg-background rounded-lg shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-5">
                    <div className="p-3 bg-muted/50 border-b flex justify-between items-center">
                        <span className="text-sm font-semibold">Uploading {uploadingFiles.length} item{uploadingFiles.length !== 1 ? 's' : ''}</span>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-3">
                        {uploadingFiles.map(filename => {
                            const p = uploadProgress[filename] || 0;
                            const isError = p === -1;
                            const isComplete = p === 100;
                            return (
                                <div key={filename} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="truncate max-w-[180px] text-muted-foreground">{filename}</span>
                                        <span className={`font-mono ${isError ? 'text-destructive' : isComplete ? 'text-green-500' : 'text-primary'}`}>
                                            {isError ? 'Err' : isComplete ? 'Done' : `${p}%`}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-200 ${isError ? 'bg-destructive' : isComplete ? 'bg-green-500' : 'bg-primary'}`}
                                            style={{ width: `${Math.max(0, p)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </PageScaffold>
    );
}
