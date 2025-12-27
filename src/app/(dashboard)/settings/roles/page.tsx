'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusiness } from '@/hooks/use-business';
import { Role, AppPermission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Shield, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation Schema
const roleSchema = z.object({
    name: z.string().min(1, 'Role name is required').max(50, 'Role name must be 50 characters or less'),
    description: z.string().optional(),
    permissions: z.array(z.string())
});

type RoleErrors = Partial<Record<keyof z.infer<typeof roleSchema>, string>>;

// Mock permissions list based on Flutter app observation (can be fetched from DB later if needed)
const AVAILABLE_PERMISSIONS: AppPermission[] = [
    { slug: 'manage_products', description: 'Can add, edit, and delete products' },
    { slug: 'manage_orders', description: 'Can process and update orders' },
    { slug: 'manage_staff', description: 'Can invite and manage staff members' },
    { slug: 'view_reports', description: 'Can view business analytics and reports' },
    { slug: 'manage_settings', description: 'Can update business settings' },
    { slug: 'manage_customers', description: 'Can view and edit customer details' },
    { slug: 'manage_bill', description: 'Can create and print bills' },
    { slug: 'view_catalog', description: 'Can view product catalog' },
    { slug: 'view_billing', description: 'Can view billing history' },
];

export default function RolesPage() {
    const { selectedBusiness, isLoading: contextLoading } = useBusiness();
    const supabase = createClient();

    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [errors, setErrors] = useState<RoleErrors>({});

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as string[],
    });

    useEffect(() => {
        if (!contextLoading && selectedBusiness) {
            fetchRoles();
        }
    }, [contextLoading, selectedBusiness]);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            if (!selectedBusiness) return;

            const { data, error } = await supabase
                .from('roles')
                .select('*, role_permissions(permissions(*))')
                .eq('business_id', selectedBusiness.id)
                .order('name');

            if (error) throw error;

            // Flatten role_permissions -> permissions slugs
            const flattenedRoles = (data ?? []).map((role: any) => {
                const perms: string[] = [];
                if (role.role_permissions) {
                    for (const rp of role.role_permissions) {
                        const p = rp.permissions;
                        if (p) {
                            if (Array.isArray(p) && p.length > 0) {
                                perms.push(p[0].slug);
                            } else if (p.slug) {
                                perms.push(p.slug);
                            }
                        }
                    }
                }
                return { ...role, permissions: perms } as Role;
            });

            setRoles(flattenedRoles);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (role?: Role) => {
        setErrors({});
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                description: role.description || '',
                permissions: role.permissions || [],
            });
        } else {
            setEditingRole(null);
            setFormData({
                name: '',
                description: '',
                permissions: [],
            });
        }
        setDialogOpen(true);
    };

    const togglePermission = (slug: string) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(slug);
            if (exists) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== slug) };
            } else {
                return { ...prev, permissions: [...prev.permissions, slug] };
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        const validation = roleSchema.safeParse(formData);
        if (!validation.success) {
            const newErrors: RoleErrors = {};
            validation.error.issues.forEach((issue) => {
                if (issue.path[0]) {
                    newErrors[issue.path[0] as keyof RoleErrors] = issue.message;
                }
            });
            setErrors(newErrors);
            toast.error('Please fix the errors in the form');
            return;
        }

        setErrors({});
        setSaveLoading(true);

        try {
            if (!selectedBusiness) throw new Error('No business selected');

            const payload = {
                business_id: selectedBusiness.id,
                name: formData.name,
                description: formData.description,
                permissions: formData.permissions,
            };

            let error;
            if (editingRole) {
                const { error: updateError } = await supabase
                    .from('roles')
                    .update(payload)
                    .eq('id', editingRole.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('roles')
                    .insert(payload);
                error = insertError;
            }

            if (error) throw error;

            toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
            setDialogOpen(false);
            fetchRoles();

        } catch (error) {
            console.error('Error saving role:', error);
            toast.error('Failed to save role');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async (roleId: string) => {
        if (!confirm('Are you sure you want to delete this role? Assigned staff might lose access.')) return;

        try {
            const { error } = await supabase
                .from('roles')
                .delete()
                .eq('id', roleId);

            if (error) throw error;
            toast.success('Role deleted successfully');
            fetchRoles();
        } catch (error) {
            console.error('Error deleting role:', error);
            toast.error('Failed to delete role');
        }
    };

    return (
        <div className="space-y-6 px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Roles & Permissions</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">Define what your staff can see and do.</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Role
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground">Loading roles...</div>
                ) : roles.length === 0 ? (
                    <div className="col-span-full py-8 sm:py-12 text-center border rounded-lg border-dashed">
                        <Shield className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                        <h3 className="text-base sm:text-lg font-medium">No Custom Roles</h3>
                        <p className="text-muted-foreground text-sm mb-4">Create roles to assign specific permissions to your team.</p>
                        <Button variant="outline" onClick={() => handleOpenDialog()}>Create First Role</Button>
                    </div>
                ) : (
                    roles.map((role) => (
                        <Card key={role.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                                    <span className="truncate">{role.name}</span>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <Button size="icon" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleOpenDialog(role)}>
                                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(role.id)}>
                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </Button>
                                    </div>
                                </CardTitle>
                                <CardDescription className="line-clamp-2 h-8 sm:h-10 text-xs sm:text-sm">
                                    {role.description || 'No description provided.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                    <div className="text-xs font-medium text-muted-foreground w-full mb-1">Permissions:</div>
                                    {role.permissions && role.permissions.length > 0 ? (
                                        role.permissions.slice(0, 3).map(p => (
                                            <span key={p} className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                                                {p.replace(/_/g, ' ')}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                                    )}
                                    {role.permissions && role.permissions.length > 3 && (
                                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-muted text-muted-foreground">
                                            +{role.permissions.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) setErrors({});
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Role Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={e => {
                                        setFormData(prev => ({ ...prev, name: e.target.value }));
                                        if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                                    }}
                                    placeholder="e.g. Shift Manager"
                                    className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Briefly describe what this role does"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Permissions
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {AVAILABLE_PERMISSIONS.map((perm) => {
                                    const isSelected = formData.permissions.includes(perm.slug);
                                    return (
                                        <div
                                            key={perm.slug}
                                            onClick={() => togglePermission(perm.slug)}
                                            className={`
                                                flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-all
                                                ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
                                            `}
                                        >
                                            <div className={`
                                                w-4 h-4 sm:w-5 sm:h-5 mt-0.5 rounded border flex items-center justify-center transition-colors flex-shrink-0
                                                ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}
                                            `}>
                                                {isSelected && <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs sm:text-sm font-medium capitalize mb-0.5 truncate">
                                                    {perm.slug.replace(/_/g, ' ')}
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight line-clamp-2">
                                                    {perm.description}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                            <Button type="submit" disabled={saveLoading} className="w-full sm:w-auto">
                                {saveLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Role
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
