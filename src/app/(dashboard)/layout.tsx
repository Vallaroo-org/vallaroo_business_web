import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, phone_number')
            .eq('id', user.id)
            .single();

        if (!profile?.display_name || !profile?.phone_number) {
            redirect('/complete-profile');
        }
    }

    return <DashboardShell>{children}</DashboardShell>;
}
