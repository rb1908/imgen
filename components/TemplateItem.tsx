'use client';

import { Template } from '@prisma/client';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Extend Template to include optional generations array as returned by getTemplates
type TemplateWithGenerations = Template & {
    generations?: { imageUrl: string }[];
};

interface TemplateItemProps {
    template: TemplateWithGenerations;
    isSelected: boolean;
    onToggle: () => void;
    onEdit: (template: Template) => void;
    onDelete: (id: string) => void;
    layoutId?: string;
}

export function TemplateItem({ template, isSelected, onToggle, onEdit, onDelete, layoutId }: TemplateItemProps) {
    // Determine the image to show: Latest generation -> Saved thumbnail -> Fallback
    const displayImage = template.generations?.[0]?.imageUrl || template.thumbnailUrl;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(template.prompt);
        toast.info("Prompt copied to clipboard!");
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(template);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(template.id);
    };

    return (
        <motion.div
            layout={!!layoutId}
            layoutId={layoutId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "group relative flex flex-col rounded-xl border text-left transition-all cursor-pointer overflow-hidden bg-card",
                isSelected
                    ? "border-primary ring-1 ring-primary z-10"
                    : "border-border hover:border-primary/50 hover:shadow-md",
            )}
            onClick={onToggle}
        >
            {/* Thumbnail */}
            <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden">
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent/50 text-muted-foreground">
                        <span className="text-xs uppercase font-medium tracking-widest opacity-50">No Image</span>
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                {isSelected && (
                    <div className="absolute top-2 right-2 text-white bg-primary rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col gap-1">
                <span className="font-medium text-sm truncate">{template.name}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{template.prompt}</span>
            </div>

            {/* Actions (Absolute positioned) */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                {!isSelected && (
                    <>
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-md bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                            title="Copy Prompt"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleEdit}
                            className="p-1.5 rounded-md bg-black/50 text-white hover:bg-blue-500/80 backdrop-blur-sm transition-colors"
                            title="Edit Template"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-1.5 rounded-md bg-black/50 text-white hover:bg-red-500/80 backdrop-blur-sm transition-colors"
                            title="Delete Template"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    );
}
