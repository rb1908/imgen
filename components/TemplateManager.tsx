"use client";

import { useState } from 'react';
import { Template } from '@prisma/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createTemplate, deleteTemplate } from '@/app/actions/templates';

interface TemplateManagerProps {
    templates: Template[];
}

export function TemplateManager({ templates }: TemplateManagerProps) {
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Prompt Templates</h2>
                <Button onClick={() => setIsAdding(!isAdding)} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Template
                </Button>
            </div>

            {isAdding && (
                <Card className="border-dashed bg-accent/20">
                    <CardHeader>
                        <CardTitle className="text-base">Create New Template</CardTitle>
                    </CardHeader>
                    <form action={async (formData) => {
                        await createTemplate(formData);
                        setIsAdding(false);
                    }}>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    name="name"
                                    placeholder="e.g. Cyberpunk Portrait"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Prompt</label>
                                <textarea
                                    name="prompt"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter your prompt structure..."
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Use {`{image}`} to denote where the uploaded image influence goes.</p>
                            </div>
                            <input type="hidden" name="category" value="custom" />
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button type="submit">Save Template</Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                    <Card key={template.id} className="group hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">
                                {template.name}
                            </CardTitle>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <form action={deleteTemplate.bind(null, template.id)}>
                                    <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {template.prompt}
                            </p>
                        </CardContent>
                        <CardFooter>
                            <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground capitalize">
                                {template.category}
                            </span>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
