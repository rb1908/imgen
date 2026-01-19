
import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading Product Studio...</p>
        </div>
    );
}
