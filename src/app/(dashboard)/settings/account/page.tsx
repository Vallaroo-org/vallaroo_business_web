'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
// import { useBusiness } from '@/components/providers/business-provider'; // Unused

import DeleteConfirmDialog from '@/components/ui/delete-confirm-dialog';
import AvatarUpload from '@/components/ui/avatar-upload';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { z } from 'zod';

// Define validation schema
const profileSchema = z.object({
    display_name: z.string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be less than 50 characters'),
    phone_number: z.string().optional().refine((val) => !val || /^\+?[0-9]{10,15}$/.test(val), {
        message: 'Invalid phone number format (e.g., +919876543210)',
    }),
    about: z.string().max(160, 'About must be less than 160 characters').optional(),
    profile_image_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AccountProfilePage() {
    const supabase = createClient();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>({});

    // Form State
    const [formData, setFormData] = useState<ProfileFormValues>({
        display_name: '',
        phone_number: '',
        about: '',
        profile_image_url: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setProfile(data);
                setFormData({
                    display_name: data.display_name || '',
                    phone_number: data.phone_number || '',
                    about: data.about || '',
                    profile_image_url: data.profile_image_url || ''
                });
            } else {
                setFormData({
                    display_name: user.user_metadata?.full_name || '',
                    phone_number: user.phone || '',
                    about: '',
                    profile_image_url: user.user_metadata?.avatar_url || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error on change
        if (errors[name as keyof ProfileFormValues]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleAvatarUpload = (url: string) => {
        setFormData(prev => ({ ...prev, profile_image_url: url }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        // Validate
        const result = profileSchema.safeParse(formData);
        if (!result.success) {
            const newErrors: Partial<Record<keyof ProfileFormValues, string>> = {};
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as keyof ProfileFormValues;
                newErrors[path] = issue.message;
            });
            setErrors(newErrors);
            setSaving(false);
            toast.error("Please fix the errors in the form.");
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const updates = {
                id: user.id,
                email: user.email,
                display_name: formData.display_name,
                phone_number: formData.phone_number,
                about: formData.about,
                profile_image_url: formData.profile_image_url || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('user_profiles')
                .upsert(updates);

            if (error) throw error;

            toast.success('Profile updated successfully!');
            fetchProfile();

        } catch (error: unknown) {
            console.error('Error updating profile:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to update profile: ${message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Soft delete by setting deleted_at
            const { error } = await supabase
                .from('user_profiles')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) throw error;

            await supabase.auth.signOut();
            router.push('/login');
            // No alert needed as we redirect, or we can assume successful if here.

        } catch (error: unknown) {
            console.error("Error deleting account:", error);
            toast.error("Failed to delete account. Please try again.");
            throw error; // Re-throw to keep dialog open or handle in dialog
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
                <p className="text-muted-foreground">Manage your personal account information.</p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your profile details and photo.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {profile && (
                            <AvatarUpload
                                uid={profile.id}
                                url={formData.profile_image_url}
                                onUpload={handleAvatarUpload}
                            />
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <Input
                                value={profile?.email || ''}
                                disabled
                                className="bg-muted text-muted-foreground cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Display Name <span className="text-destructive">*</span></label>
                            <Input
                                name="display_name"
                                value={formData.display_name}
                                onChange={handleChange}
                                placeholder="Your Name"
                                className={`bg-background text-foreground ${errors.display_name ? 'border-destructive focus-visible:ring-destructive' : 'border-input'}`}
                            />
                            {errors.display_name && (
                                <p className="text-xs text-destructive mt-1">{errors.display_name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Phone Number</label>
                            <Input
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="+91 9876543210"
                                className={`bg-background text-foreground ${errors.phone_number ? 'border-destructive focus-visible:ring-destructive' : 'border-input'}`}
                            />
                            {errors.phone_number && (
                                <p className="text-xs text-destructive mt-1">{errors.phone_number}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">About</label>
                            <Input
                                name="about"
                                value={formData.about}
                                onChange={handleChange}
                                placeholder="Tell us about yourself"
                                className={`bg-background text-foreground ${errors.about ? 'border-destructive focus-visible:ring-destructive' : 'border-input'}`}
                            />
                            {errors.about && (
                                <p className="text-xs text-destructive mt-1">{errors.about}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t border-border flex justify-end p-4">
                        <Button type="submit" disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-600/80 dark:text-red-400/80">
                        Irreversible actions related to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Deleting your account will deactivate your access. You may not be able to recover your data immediately.
                    </p>
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                    </Button>
                </CardContent>
            </Card>

            <DeleteConfirmDialog
                key={showDeleteDialog ? 'open' : 'closed'}
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Account"
                description="This action cannot be undone immediately. Your account will be soft-deleted. Please type 'delete' to confirm."
                confirmPhrase="delete"
            />
        </div>
    );
}
