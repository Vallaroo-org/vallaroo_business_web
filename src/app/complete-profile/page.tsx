'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Changed from useToast
import { Loader2 } from 'lucide-react';

export default function CompleteProfilePage() {
    const [username, setUsername] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    // Removed: const { toast } = useToast();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                toast.error("Error fetching user: Please try logging in again."); // Updated toast call
                return;
            }

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    display_name: username,
                    phone_number: phoneNumber,
                })
                .eq('id', user.id);

            if (error) {
                throw error;
            }

            toast.success("Profile updated successfully"); // Updated toast call

            router.push('/');
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
                {/* Adaptive Logo */}
                <div className="mx-auto h-20 w-auto relative mb-6">
                    <img
                        src="/vallaroo_business_light_mode.png"
                        alt="Vallaroo Business"
                        className="h-full w-auto mx-auto dark:hidden"
                    />
                    <img
                        src="/vallaroo_business_dark_mode.png"
                        alt="Vallaroo Business"
                        className="h-full w-auto mx-auto hidden dark:block"
                    />
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
                    Complete your profile
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Please provide your details to continue.
                </p>
            </div>

            <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg border border-border">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Full Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" // Standard shadcn input styles
                                placeholder="e.g. John Doe"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobile-number" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Mobile Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="mobile-number"
                                name="mobile-number"
                                type="tel"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="e.g. +91 9876543210"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save & Continue
                        </Button>
                    </div>
                </form>
            </div>
            <p className="mt-8 text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Vallaroo Inc. All rights reserved.
            </p>
        </div>
    );
}
