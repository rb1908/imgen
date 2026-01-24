import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface Metafield {
    id: string;
    namespace: string;
    key: string;
    value: string;
    type: string;
}

interface MetafieldsListProps {
    metafields: Metafield[];
    onUpdate: (id: string, field: keyof Metafield, value: string) => void;
    onAdd: () => void;
    onRemove: (id: string) => void;
}

export function MetafieldsList({ metafields, onUpdate, onAdd, onRemove }: MetafieldsListProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">Metafields</Label>
                <Button variant="ghost" size="sm" onClick={onAdd} className="h-6 px-2 text-indigo-600 hover:bg-indigo-50 text-xs"><Plus className="w-3 h-3 mr-1" /> Add Field</Button>
            </div>
            {metafields.map((meta) => (
                <div key={meta.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-100 group">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input value={meta.key} onChange={e => onUpdate(meta.id, 'key', e.target.value)} placeholder="Key (e.g. fabric)" className="h-7 text-xs bg-white" />
                        <Input value={meta.value} onChange={e => onUpdate(meta.id, 'value', e.target.value)} placeholder="Value" className="h-7 text-xs bg-white" />
                    </div>
                    <button onClick={() => onRemove(meta.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                </div>
            ))}
            {metafields.length === 0 && <div className="text-sm text-gray-400 italic">No custom fields</div>}
        </div>
    );
}
