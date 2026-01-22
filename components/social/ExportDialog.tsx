'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Check, Copy, Download } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: {
        imageUrl: string;
        caption: string;
    } | null;
}

export function ExportDialog({ open, onOpenChange, post }: ExportDialogProps) {
    const [copiedCaption, setCopiedCaption] = useState(false);

    if (!post) return null;

    const handleCopyCaption = () => {
        navigator.clipboard.writeText(post.caption);
        setCopiedCaption(true);
        toast.success("Caption copied!");
        setTimeout(() => setCopiedCaption(false), 2000);
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(post.imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `social-post-${Date.now()}.png`; // improved filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Image downloaded!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to download image");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Post</DialogTitle>
                    <DialogDescription>
                        Your post is ready! Download the image and copy your caption.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Image Preview & Download */}
                    <div className="space-y-3">
                        <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                            <Image src={post.imageUrl} alt="Final Post" fill className="object-cover" />
                        </div>
                        <Button className="w-full" onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" /> Download Image
                        </Button>
                    </div>

                    {/* Caption Copy */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Caption</div>
                        <div className="relative">
                            <div className="p-3 bg-muted rounded-md text-sm text-foreground/80 min-h-[80px] text-wrap break-words">
                                {post.caption}
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2 h-6 px-2 text-xs bg-background/50 hover:bg-background shadow-sm backdrop-blur-sm"
                                onClick={handleCopyCaption}
                            >
                                {copiedCaption ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                                {copiedCaption ? "Copied" : "Copy"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
