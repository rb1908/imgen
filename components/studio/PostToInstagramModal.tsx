'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Instagram, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { publishToInstagram } from '@/app/actions/instagram';

interface PostToInstagramModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
}

export function PostToInstagramModal({ isOpen, onClose, imageUrl }: PostToInstagramModalProps) {
    const [caption, setCaption] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!imageUrl) return null;

    const handlePost = async () => {
        setIsPosting(true);
        try {
            const res = await publishToInstagram(imageUrl, caption);
            if (res.success) {
                setIsSuccess(true);
                toast.success("Posted to Instagram!");
                setTimeout(() => {
                    onClose();
                    setIsSuccess(false);
                    setCaption('');
                }, 2000);
            } else {
                toast.error(res.error || "Failed to post");
            }
        } catch (e) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isPosting && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Instagram className="w-5 h-5 text-pink-600" />
                        Post to Instagram
                    </DialogTitle>
                </DialogHeader>

                {isSuccess ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in zoom-in">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <p className="font-semibold text-lg text-zinc-800">Published Successfully!</p>
                        <p className="text-zinc-500">Your image is now live on your feed.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="relative aspect-square w-full rounded-md overflow-hidden border border-zinc-200 bg-zinc-50">
                            <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Caption</label>
                            <Textarea
                                placeholder="Write a caption..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="min-h-[100px] resize-none"
                            />
                        </div>
                    </div>
                )}

                {!isSuccess && (
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={isPosting}>Cancel</Button>
                        <Button
                            onClick={handlePost}
                            disabled={isPosting}
                            className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 border-0 text-white"
                        >
                            {isPosting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Post Now
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
