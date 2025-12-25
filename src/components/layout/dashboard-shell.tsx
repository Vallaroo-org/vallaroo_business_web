'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    ShoppingCart,
    Users,
    BarChart3,
    Settings,
    Menu,
    X,
    Store,
    ChevronDown,
    Building2,
    FileText,
    PlusCircle,
    Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { BusinessProvider, useBusiness } from '@/components/providers/business-provider';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import LanguageSwitcher from '@/components/ui/language-switcher';
import { useLanguage } from '@/contexts/language-context';

import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';

export function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // const { t } = useLanguage(); // Unused here for now

    return (
        <BusinessProvider>
            <div className="min-h-screen bg-muted/40 dark:bg-black transition-colors duration-200 flex">
                {/* Mobile sidebar backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Mobile Sidebar */}
                <div className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-background transform transition-transform duration-200 ease-in-out lg:hidden border-r border-border print:hidden",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <Sidebar mobile onClose={() => setSidebarOpen(false)} />
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden lg:flex w-72 flex-col fixed inset-y-0 z-30 print:hidden">
                    <Sidebar />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen lg:ml-72 transition-all duration-200 print:ml-0">
                    {/* Using reusable Navbar component */}
                    <div className="print:hidden">
                        <Navbar onMenuClick={() => setSidebarOpen(true)} />
                    </div>

                    <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </BusinessProvider>
    );
}
