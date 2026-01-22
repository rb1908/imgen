'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SocialEditor } from './SocialEditor';

interface FineTuneCanvasProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    baseImage: string;
    onSave: (finalImage: string) => void;
}

export function FineTuneCanvas({ open, onOpenChange, baseImage, onSave }: FineTuneCanvasProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] h-[95vh] p-0 flex flex-col md:flex-row gap-0 overflow-hidden bg-background">
                <SocialEditor 
                    baseImage={baseImage} 
                    onSave={(url) => {
                        onSave(url);
                        onOpenChange(false);
                    }} 
                />
            </DialogContent>
        </Dialog>
    );
}
