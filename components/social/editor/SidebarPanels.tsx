import { motion, AnimatePresence } from 'framer-motion';
import { LayersPanel } from '../LayersPanel';
import { ShapesPanel } from '../ShapesPanel';
import { TextPresetsPanel } from '../TextPresetsPanel';
import { ImagesPanel } from '../ImagesPanel';

interface SidebarPanelsProps {
    activeTool: string | null;
}

export function SidebarPanels({ activeTool }: SidebarPanelsProps) {
    return (
        <AnimatePresence mode="wait">
            {activeTool === 'layers' && (
                <motion.div
                    key="layers-panel"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r border-neutral-800 bg-neutral-900 overflow-hidden z-20"
                >
                    <div className="w-[280px] h-full">
                        <LayersPanel />
                    </div>
                </motion.div>
            )}
            {activeTool === 'shapes' && (
                <motion.div
                    key="shapes-panel"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r border-neutral-800 bg-neutral-900 overflow-hidden z-20"
                >
                    <div className="w-[280px] h-full">
                        <ShapesPanel />
                    </div>
                </motion.div>
            )}
            {activeTool === 'text' && (
                <motion.div
                    key="text-panel"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r border-neutral-800 bg-neutral-900 overflow-hidden z-20"
                >
                    <div className="w-[280px] h-full">
                        <TextPresetsPanel />
                    </div>
                </motion.div>
            )}
            {activeTool === 'images' && (
                <motion.div
                    key="images-panel"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r border-neutral-800 bg-neutral-900 overflow-hidden z-20"
                >
                    <div className="w-[280px] h-full">
                        <ImagesPanel />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
