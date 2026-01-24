import { Input } from '@/components/ui/input';

interface Variant {
    id: string;
    title: string;
    price: string | null;
    sku: string | null;
    inventoryQty: number;
}

interface VariantsTableProps {
    variants: Variant[];
    onUpdate: (id: string, field: keyof Variant, value: any) => void;
}

export function VariantsTable({ variants, onUpdate }: VariantsTableProps) {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                        <th className="px-3 py-2 text-left">Variant</th>
                        <th className="px-3 py-2 text-left w-24">Price</th>
                        <th className="px-3 py-2 text-left w-28">SKU</th>
                        <th className="px-3 py-2 text-right w-20">Inv</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {variants.map((v) => (
                        <tr key={v.id} className="group">
                            <td className="px-3 py-2 font-medium text-gray-900 truncate max-w-[120px]" title={v.title}>{v.title}</td>
                            <td className="px-2 py-1"><Input value={v.price || ''} onChange={e => onUpdate(v.id, 'price', e.target.value)} className="h-7 text-xs px-2 bg-transparent border-transparent hover:border-gray-200 focus:border-indigo-500 transition-colors text-right" placeholder="-" /></td>
                            <td className="px-2 py-1"><Input value={v.sku || ''} onChange={e => onUpdate(v.id, 'sku', e.target.value)} className="h-7 text-xs px-2 bg-transparent border-transparent hover:border-gray-200 focus:border-indigo-500 transition-colors font-mono" placeholder="SKU" /></td>
                            <td className="px-2 py-1"><Input type="number" value={v.inventoryQty} onChange={e => onUpdate(v.id, 'inventoryQty', parseInt(e.target.value) || 0)} className="h-7 text-xs px-2 bg-transparent border-transparent hover:border-gray-200 focus:border-indigo-500 transition-colors text-right" placeholder="0" /></td>
                        </tr>
                    ))}
                    {variants.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400 italic">No variants</td></tr>}
                </tbody>
            </table>
        </div>
    );
}
