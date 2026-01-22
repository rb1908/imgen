'use client';

import { Button } from '@/components/ui/button';
import { MousePointer2, Type, Image as ImageIcon, LayoutTemplate, Grid3X3, Smartphone } from 'lucide-react';
import { useCanvasStore } from '@/lib/canvas/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SocialEditorTools() {
    const { dispatch, safeAreaVisible, setSafeAreaVisible, snapEnabled, setSnapEnabled } = useCanvasStore();

    const handleAddText = () => {
        dispatch({
            type: 'ADD_TEXT',
            content: 'Double Tap to Edit',
            x: 540,
            y: 540,
            style: 'modern'
        });
    };

    // Placeholder for Image Upload Trigger (Real implementation needs a hidden input or asset picker)
    const handleAddImage = () => {
        // Trigger generic "Add Image" - normally opens a dialog
        // For V1, let's just dispatch a placeholder to show it works, or rely on the "Asset Picker" in properties?
        // User requested "Image/Logo tool". Ideally clicks button -> opens file picker.
        document.getElementById('editor-image-upload')?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            dispatch({
                type: 'ADD_IMAGE',
                url, // Simplified action, assumes Action knows what to do
                x: 540,
                y: 540
            } as any); // Type cast for now until we update commands type definition if needed, or use ADD_TOOL with image type
        }
    };

    return (
        <TooltipProvider>
            <div className="w-16 border-r border-neutral-800 bg-neutral-900 flex flex-col items-center py-4 gap-4 z-10 h-full">

                <ToolButton icon={<MousePointer2 />} label="Select" active />

                <ToolButton icon={<Type />} label="Add Text" onClick={handleAddText} />

                <div className="relative">
                    <ToolButton icon={<ImageIcon />} label="Add Image" onClick={handleAddImage} />
                    <input
                        id="editor-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                <div className="h-px w-8 bg-border my-2" />

                <ToolButton
                    icon={<Grid3X3 />}
                    label="Snap Guides"
                    active={snapEnabled}
                    onClick={() => setSnapEnabled(!snapEnabled)}
                />

                <ToolButton
                    icon={<Smartphone />}
                    label="Safe Area"
                    active={safeAreaVisible}
                    onClick={() => setSafeAreaVisible(!safeAreaVisible)}
                />

            </div>
        </TooltipProvider>
    );
}

function ToolButton({ icon, label, onClick, active }: any) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant={active ? "default" : "ghost"}
                    size="icon"
                    onClick={onClick}
                    className={active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}
                >
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
}
