import { Construction } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
                <Construction className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground max-w-sm">
                Global configuration and account preferences will live here soon.
            </p>
        </div>
    );
}
