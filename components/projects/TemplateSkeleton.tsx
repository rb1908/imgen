import { Skeleton } from "@/components/ui/skeleton";

export function TemplateSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border bg-card">
                    <Skeleton className="h-full w-full" />
                </div>
            ))}
        </div>
    );
}
