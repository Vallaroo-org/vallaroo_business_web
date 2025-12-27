'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StaffMember, StaffRole, Role } from '@/lib/types';
import { useBusiness } from '@/hooks/use-business';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Mail, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation Schema for Invite
const inviteSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
    name: z.string().min(1, 'Display name is required').max(100, 'Name must be 100 characters or less'),
    role: z.string().min(1, 'Role is required')
});

type InviteErrors = Partial<Record<keyof z.infer<typeof inviteSchema>, string>>;

export default function StaffPage() {
    const { selectedBusiness, selectedShop, isLoading: contextLoading } = useBusiness();
    const supabase = createClient();

    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    // Invite State
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<string>('staff');
    const [inviteErrors, setInviteErrors] = useState<InviteErrors>({});

    // Dynamic Roles State
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

    // Edit State
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [editRole, setEditRole] = useState<string>('staff');
    const [updateLoading, setUpdateLoading] = useState(false);

    // Delete State
    const [deleteStaff, setDeleteStaff] = useState<StaffMember | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (!contextLoading && selectedBusiness) {
            fetchStaff();
            fetchRoles();
        }
    }, [contextLoading, selectedBusiness]);

    const fetchRoles = async () => {
        if (!selectedBusiness) return;
        const { data } = await supabase
            .from('roles')
            .select('*')
            .eq('business_id', selectedBusiness.id);

        if (data) setAvailableRoles(data as Role[]);
    };

    const fetchStaff = async () => {
        try {
            setLoading(true);
            if (!selectedBusiness) return;

            const { data, error } = await supabase
                .from('staff_members')
                .select('*')
                .eq('business_id', selectedBusiness.id)
                .order('invited_at', { ascending: false });

            if (error) throw error;
            setStaff(data as StaffMember[] || []);

        } catch (error) {
            console.error('Error loading staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearInviteErrors = (field: keyof InviteErrors) => {
        if (inviteErrors[field]) {
            setInviteErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        const validation = inviteSchema.safeParse({
            email: inviteEmail,
            name: inviteName,
            role: inviteRole
        });

        if (!validation.success) {
            const newErrors: InviteErrors = {};
            validation.error.issues.forEach((issue) => {
                if (issue.path[0]) {
                    newErrors[issue.path[0] as keyof InviteErrors] = issue.message;
                }
            });
            setInviteErrors(newErrors);
            toast.error('Please fix the errors in the form');
            return;
        }

        setInviteErrors({});
        setInviteLoading(true);

        try {
            if (!selectedBusiness) throw new Error('No business selected');

            const isCustomRole = availableRoles.some(r => r.id === inviteRole);
            const payload: any = {
                email: inviteEmail,
                business_id: selectedBusiness.id,
                shop_id: selectedShop?.id,
                display_name: inviteName,
            };

            if (isCustomRole) {
                payload.role_id = inviteRole;
                payload.role = 'staff'; // Fallback
            } else {
                payload.role = inviteRole;
            }

            const { error } = await supabase.functions.invoke('invite-user', {
                body: payload
            });

            if (error) throw error;

            toast.success('Invitation sent successfully!');
            setInviteEmail('');
            setInviteName('');
            setInviteRole('staff');
            setInviteOpen(false);
            fetchStaff();

        } catch (error: any) {
            console.error('Error inviting staff:', error);
            toast.error('Failed to invite staff. Please try again.');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveStaff = async () => {
        if (!deleteStaff) return;
        setDeleteLoading(true);

        try {
            const { error } = await supabase
                .from('staff_members')
                .delete()
                .eq('id', deleteStaff.id);

            if (error) throw error;
            toast.success('Staff member removed successfully');
            setStaff(prev => prev.filter(s => s.id !== deleteStaff.id));
            setDeleteStaff(null);
        } catch (error) {
            console.error('Error removing staff:', error);
            toast.error('Failed to remove staff member.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;
        setUpdateLoading(true);

        try {
            const isCustomRole = availableRoles.some(r => r.id === editRole);
            const updates: any = {};
            if (isCustomRole) {
                updates.role_id = editRole;
            } else {
                updates.role = editRole;
                updates.role_id = null;
            }

            const { error } = await supabase
                .from('staff_members')
                .update(updates)
                .eq('id', editingStaff.id);

            if (error) throw error;

            setStaff(prev => prev.map(s => {
                if (s.id === editingStaff.id) {
                    return {
                        ...s,
                        role: (!isCustomRole ? editRole : s.role) as StaffRole,
                        role_id: isCustomRole ? editRole : null
                    };
                }
                return s;
            }));
            setEditingStaff(null);
            toast.success('Role updated successfully!');
        } catch (error: any) {
            console.error('Error updating role:', error);
            toast.error('Failed to update role. Please try again.');
        } finally {
            setUpdateLoading(false);
        }
    };

    const openEditDialog = (member: StaffMember) => {
        setEditingStaff(member);
        const customRole = availableRoles.find(r => r.id === member.role_id);
        if (customRole) {
            setEditRole(customRole.id);
        } else {
            setEditRole(member.role);
        }
    };

    const rolesList = [
        { value: 'owner', label: 'Owner' },
        { value: 'manager', label: 'Manager' },
        { value: 'staff', label: 'Staff' },
        { value: 'cashier', label: 'Cashier' },
        { value: 'inventory', label: 'Inventory Manager' },
        { value: 'viewer', label: 'Viewer' },
        ...availableRoles.map(r => ({ value: r.id, label: `${r.name} (Custom)` }))
    ];

    return (
        <div className="space-y-6 px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Staff & Permissions</h1>
                <Dialog open={inviteOpen} onOpenChange={(open) => {
                    setInviteOpen(open);
                    if (!open) setInviteErrors({});
                }}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="mx-4 sm:mx-0 max-w-md">
                        <DialogHeader>
                            <DialogTitle>Invite New Member</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    Email Address <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => {
                                        setInviteEmail(e.target.value);
                                        clearInviteErrors('email');
                                    }}
                                    placeholder="colleague@example.com"
                                    className={`bg-background border-input text-foreground ${inviteErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                />
                                {inviteErrors.email && (
                                    <p className="text-xs text-destructive">{inviteErrors.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    Display Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="text"
                                    value={inviteName}
                                    onChange={(e) => {
                                        setInviteName(e.target.value);
                                        clearInviteErrors('name');
                                    }}
                                    placeholder="John Doe"
                                    className={`bg-background border-input text-foreground ${inviteErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                />
                                {inviteErrors.name && (
                                    <p className="text-xs text-destructive">{inviteErrors.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    Role <span className="text-destructive">*</span>
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => {
                                        setInviteRole(e.target.value);
                                        clearInviteErrors('role');
                                    }}
                                    className={`block w-full rounded-md border bg-background text-foreground px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${inviteErrors.role ? 'border-destructive' : 'border-input'}`}
                                >
                                    {rolesList.filter(r => r.value !== 'owner').map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                                {inviteErrors.role && (
                                    <p className="text-xs text-destructive">{inviteErrors.role}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Select a standard role or a custom role defined in Roles settings.
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={inviteLoading}>
                                {inviteLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending Invite...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Invitation
                                    </>
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-border bg-card">
                <CardContent className="p-0 bg-card">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading staff...</div>
                    ) : staff.length === 0 ? (
                        <div className="p-8 sm:p-12 text-center">
                            <h3 className="text-sm font-semibold text-foreground">No staff members yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Invite your team to collaborate.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Member</th>
                                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                                        <th scope="col" className="relative px-3 sm:px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {staff.map((member) => (
                                        <tr key={member.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    {member.profile_image_url ? (
                                                        <img src={member.profile_image_url} alt={member.display_name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                                                            {member.display_name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-foreground truncate">{member.display_name}</div>
                                                        <div className="text-xs text-muted-foreground truncate hidden sm:block">{member.email}</div>
                                                        {/* Mobile: show status inline */}
                                                        <div className="sm:hidden mt-0.5">
                                                            {member.is_active === false ? (
                                                                <span className="text-xs text-red-500">Inactive</span>
                                                            ) : member.joined_at ? (
                                                                <span className="text-xs text-green-500">Active</span>
                                                            ) : (
                                                                <span className="text-xs text-orange-500">Pending</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => openEditDialog(member)}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize cursor-pointer hover:bg-opacity-80 transition-opacity bg-secondary text-secondary-foreground`}
                                                    title="Click to edit role"
                                                    disabled={member.role === 'owner'}
                                                >
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    <span className="truncate max-w-[60px] sm:max-w-none">
                                                        {availableRoles.find(r => r.id === member.role_id)?.name || member.role}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                                                {member.is_active === false ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                        Inactive
                                                    </span>
                                                ) : member.joined_at ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center gap-2 sm:gap-3">
                                                    {member.role !== 'owner' && (
                                                        <button
                                                            onClick={() => openEditDialog(member)}
                                                            className="text-primary hover:text-primary/80 transition-colors text-xs sm:text-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            // Show member details in a toast for now (could open a dialog)
                                                            toast.info(`${member.display_name}\n${member.email}\nStatus: ${member.is_active === false ? 'Inactive' : member.joined_at ? 'Active' : 'Pending'}`);
                                                        }}
                                                        className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
                                                    >
                                                        View
                                                    </button>
                                                    {member.role !== 'owner' && (
                                                        <button
                                                            onClick={() => setDeleteStaff(member)}
                                                            className="p-1 sm:p-1.5 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10 transition-colors"
                                                            title="Remove Staff"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!editingStaff} onOpenChange={(open) => !open && setEditingStaff(null)}>
                <DialogContent className="mx-4 sm:mx-0 max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Role: {editingStaff?.display_name}</DialogTitle>
                    </DialogHeader>
                    {editingStaff && (
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">Select New Role</label>
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {rolesList.filter(r => r.value !== 'owner').map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditingStaff(null)} className="w-full sm:w-auto">Cancel</Button>
                                <Button type="submit" disabled={updateLoading} className="w-full sm:w-auto">
                                    {updateLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteStaff} onOpenChange={(open) => !open && setDeleteStaff(null)}>
                <DialogContent className="max-w-md mx-4 sm:mx-0">
                    <DialogHeader>
                        <DialogTitle>Remove Staff Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove <strong>{deleteStaff?.display_name}</strong>? They will lose access to this business.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setDeleteStaff(null)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRemoveStaff} disabled={deleteLoading} className="w-full sm:w-auto">
                            {deleteLoading ? 'Removing...' : 'Remove'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
