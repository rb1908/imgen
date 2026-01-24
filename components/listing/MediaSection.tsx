import Image from 'next/image';
import { Plus, Sparkles } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface MediaSectionProps {
    images: string[];
    onOpenStudio: (imageUrl?: string) => void;
}

export function MediaSection({ images, onOpenStudio }: MediaSectionProps) {
    return (
        <CollapsibleSection title="Media">
            <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                    {images.map((img, i) => (
                        <button key={i} onClick={() => onOpenStudio(img)} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer">
                            <Image src={img} alt="" fill className="object-cover" />
                        </button>
                    ))}
                    <button className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600">
                        <Plus className="w-6 h-6" />
                    </button>
                    <button onClick={() => onOpenStudio()} className="w-20 h-20 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center gap-1 hover:bg-indigo-100 transition-colors text-indigo-600 group">
                        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Studio</span>
                    </button>
                </div>
            </div>
        </CollapsibleSection>
    );
}
