import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div className="max-w-6xl mx-auto space-y-6 py-8 px-4 h-full">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card text-card-foreground shadow space-y-3 p-0 overflow-hidden">
                        <div className="aspect-video bg-muted animate-pulse" />
                        <div className="p-4 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function ProjectSkeleton() {
    return (
        <div className="h-full flex flex-col gap-6 relative">
            {/* Header */}
            <div className="flex-none flex items-center gap-4 px-4 border-b h-14">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-6 w-48" />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-4 py-8">
                <div className="max-w-[1800px] mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-8 w-24" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="aspect-square rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Bar Mobile */}
            <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 flex gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-12 w-32 rounded-full" />
            </div>
        </div>
    )
}
