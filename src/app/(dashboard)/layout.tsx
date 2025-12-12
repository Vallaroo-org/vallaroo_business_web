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

const navigationGroups = [
    {
        group: 'Overview',
        items: [
            { name: 'dashboard', href: '/', icon: LayoutDashboard },
        ]
    },
    {
        group: 'Sales',
        items: [
            { name: 'new_bill', href: '/new-bill', icon: PlusCircle },
            { name: 'orders', href: '/orders', icon: ShoppingCart },
            { name: 'bill_history', href: '/bill-history', icon: FileText },
        ]
    },
    {
        group: 'Management',
        items: [
            { name: 'catalog', href: '/catalog', icon: ShoppingBag },
            { name: 'customers', href: '/customers', icon: Users },
        ]
    },
    {
        group: 'Analytics',
        items: [
            { name: 'reports', href: '/reports', icon: BarChart3 },
        ]
    },
    {
        group: 'System',
        items: [
            { name: 'settings', href: '/settings', icon: Settings },
        ]
    }
];

function SidebarContent({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { selectedBusiness, selectedShop } = useBusiness();
    const supabase = createClient();
    const { t } = useLanguage();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transition-colors duration-200">
            {/* Logo & Business Switcher Trigger */}
            <div className="flex flex-col px-6 py-4 border-b border-gray-200 dark:border-zinc-800 gap-4">
                <div className="relative flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        {/* Light Mode Logo */}
                        <img
                            src="/vallaroo_business_light_mode.png"
                            alt="Vallaroo Business"
                            className="h-20 dark:hidden"
                        />
                        {/* Dark Mode Logo */}
                        <img
                            src="/vallaroo_business_dark_mode.png"
                            alt="Vallaroo Business"
                            className="h-20 hidden dark:block"
                        />
                    </div>
                    {mobile && (
                        <button onClick={onClose} className="absolute right-0 top-1/2 -translate-y-1/2 lg:hidden">
                            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Business/Shop Switcher Button */}
                <Button
                    variant="outline"
                    className="w-full justify-between bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800"
                    onClick={() => router.push('/businesses')}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                        <div className="flex flex-col items-start truncate">
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                {selectedBusiness?.name || 'Select Business'}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {selectedShop?.name || 'Select Shop'}
                            </span>
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                {navigationGroups.map((group) => (
                    <div key={group.group}>
                        <h3 className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            {t(group.group.toLowerCase()) || group.group}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={mobile ? onClose : undefined}
                                        className={cn(
                                            "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                                            isActive
                                                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                                                : "text-gray-700 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        <item.icon className={cn("w-5 h-5 mr-3 flex-shrink-0 transition-colors", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400")} />
                                        {t(item.name)}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
                <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                    {t('logout')}
                </button>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // const { t } = useLanguage(); // Unused here for now

    return (
        <BusinessProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200 flex">
                {/* Mobile sidebar backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Mobile Sidebar */}
                <div className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 transform transition-transform duration-200 ease-in-out lg:hidden border-r border-gray-200 dark:border-zinc-800",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <SidebarContent mobile onClose={() => setSidebarOpen(false)} />
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden lg:flex w-72 flex-col fixed inset-y-0 z-30">
                    <SidebarContent />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen lg:ml-72 transition-all duration-200">
                    {/* Premium Header */}
                    <div className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 transition-colors duration-200">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 lg:hidden"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <LanguageSwitcher />
                            <ThemeToggle />
                            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800">
                                <Bell className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </BusinessProvider>
    );
}
