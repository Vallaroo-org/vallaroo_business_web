'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StaffMember, StaffRole } from '@/lib/types';
import { useBusiness } from '@/hooks/use-business';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, Mail, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffPage() {
    const { selectedBusiness, selectedShop, isLoading: contextLoading } = useBusiness();
    const supabase = createClient();

    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteLoading, setInviteLoading] = useState(false);

    // Invite Form State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<StaffRole>('staff');

    useEffect(() => {
        if (!contextLoading && selectedBusiness) {
            fetchStaff();
        }
    }, [contextLoading, selectedBusiness]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchStaff = async () => {
        try {
            setLoading(true);
            if (!selectedBusiness) return;

            // Fetch staff linked to this business
            // Note: This relies on a view or RLS policy that returns staff_members
            const { data, error } = await supabase
                .from('staff_members')
                .select('*')
                .eq('business_id', selectedBusiness.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaff(data as StaffMember[] || []);

        } catch (error) {
            console.error('Error loading staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);

        try {
            if (!selectedBusiness) throw new Error('No business selected');

            const { error } = await supabase.functions.invoke('invite-user', {
                body: {
                    email: inviteEmail,
                    role: inviteRole,
                    business_id: selectedBusiness.id,
                    shop_id: selectedShop?.id, // Optional, can be null
                    display_name: inviteName,
                }
            });

            if (error) throw error;

            // Check for specific error status from function if needed
            // Assuming 200 OK means success

            toast.success('Invitation sent successfully!');
            setInviteEmail('');
            setInviteName('');
            setInviteRole('staff');
            fetchStaff(); // Refresh list

        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error inviting staff:', error);
            toast.error('Failed to invite staff. Please try again.');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveStaff = async (staffId: string) => {
        if (!confirm('Are you sure you want to remove this staff member?')) return;

        try {
            const { error } = await supabase
                .from('staff_members')
                .delete()
                .eq('id', staffId);

            if (error) throw error;
            fetchStaff();
        } catch (error) {
            console.error('Error removing staff:', error);
            toast.error('Failed to remove staff member.');
        }
    };

    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [editRole, setEditRole] = useState<StaffRole>('staff');
    const [updateLoading, setUpdateLoading] = useState(false);

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;
        setUpdateLoading(true);

        try {
            const { error } = await supabase
                .from('staff_members')
                .update({ role: editRole })
                .eq('id', editingStaff.id);

            if (error) throw error;

            setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, role: editRole } : s));
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
        setEditRole(member.role);
    };

    const roles: { value: StaffRole; label: string }[] = [
        { value: 'owner', label: 'Owner' }, // Should owner be assignable? Maybe not by staff, but by owner.
        { value: 'manager', label: 'Manager' },
        { value: 'staff', label: 'Staff' },
        { value: 'cashier', label: 'Cashier' },
        { value: 'inventory', label: 'Inventory Manager' },
        { value: 'viewer', label: 'Viewer' },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">Staff & Permissions</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Invite Form */}
                <Card className="lg:col-span-1 h-fit bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Invite New Member
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                                <Input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                                    required
                                    placeholder="colleague@example.com"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
                                <Input
                                    type="text"
                                    value={inviteName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteName(e.target.value)}
                                    required
                                    placeholder="John Doe"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                                    className="block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {roles.filter(r => r.value !== 'owner').map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {inviteRole === 'manager' && 'Full access to all features.'}
                                    {inviteRole === 'staff' && 'Can manage orders and basic items.'}
                                    {inviteRole === 'cashier' && 'Can only process billing.'}
                                    {inviteRole === 'viewer' && 'Read-only access.'}
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
                    </CardContent>
                </Card>

                {/* Staff List */}
                <Card className="lg:col-span-2 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg">Team Members</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading staff...</div>
                        ) : staff.length === 0 ? (
                            <div className="p-12 text-center">
                                <h3 className="text-sm font-semibold text-foreground">No staff members yet</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Invite your team to collaborate.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {staff.map((member) => (
                                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {member.profile_image_url ? (
                                                <img src={member.profile_image_url} alt={member.display_name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                                    {member.display_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-foreground">{member.display_name}</div>
                                                <div className="text-xs text-muted-foreground">{member.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-end">
                                                <button
                                                    onClick={() => openEditDialog(member)}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize cursor-pointer hover:bg-opacity-80 transition-opacity
                                                    ${member.role === 'owner' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                                                            member.role === 'manager' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                                                'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}
                                                    title="Click to edit role"
                                                    disabled={member.role === 'owner'} // Cannot edit owner role directly here usually
                                                >
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    {member.role}
                                                </button>
                                                {member.is_active === false && (
                                                    <span className="text-xs text-destructive mt-1">Inactive</span>
                                                )}
                                                {member.joined_at ? (
                                                    <span className="text-[10px] text-muted-foreground mt-0.5">Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                                                ) : (
                                                    <span className="text-[10px] text-orange-500 mt-0.5">Pending Invite</span>
                                                )}
                                            </div>
                                            {/* Prevent deleting yourself or the owner if you aren't one - logic simplified for UI */}
                                            {member.role !== 'owner' && (
                                                <button
                                                    onClick={() => handleRemoveStaff(member.id)}
                                                    className="p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10 transition-colors"
                                                    title="Remove Staff"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Role Dialog (Simple Modal Implementation) */}
            {editingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-foreground mb-4">Edit Role: {editingStaff.display_name}</h2>
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Select New Role</label>
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value as StaffRole)}
                                    className="block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {roles.filter(r => r.value !== 'owner').map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditingStaff(null)}>Cancel</Button>
                                <Button type="submit" disabled={updateLoading}>
                                    {updateLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
