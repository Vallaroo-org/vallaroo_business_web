'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    ShoppingCart,
    Users,
    BarChart3,
    Settings,
    X,
    Building2,
    FileText,
    PlusCircle,
    ChevronDown,
    Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useBusiness } from '@/components/providers/business-provider';
import { Button } from '@/components/ui/button';
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
            { name: 'new_orders', href: '/orders', icon: ShoppingCart },
            { name: 'order_history', href: '/orders/history', icon: FileText },
            { name: 'new_bill', href: '/new-bill', icon: PlusCircle },
            { name: 'bill_history', href: '/bill-history', icon: FileText },
        ]
    },
    {
        group: 'Management',
        items: [
            { name: 'catalog', href: '/catalog', icon: ShoppingBag },
            { name: 'services', href: '/services', icon: Wrench },
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

import { useNewOrdersCount } from '@/hooks/use-new-orders-count';

export function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { selectedBusiness, selectedShop } = useBusiness();
    const supabase = createClient();
    const { t } = useLanguage();
    const newOrdersCount = useNewOrdersCount(selectedShop?.id);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-full bg-background border-r border-border transition-colors duration-200">
            {/* Logo & Business Switcher Trigger */}
            <div className="flex flex-col px-6 py-4 border-b border-border gap-4">
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
                            <X className="w-6 h-6 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Business/Shop Switcher Button */}
                <Button
                    variant="outline"
                    className="w-full justify-between bg-muted/50 border-border hover:bg-background"
                    onClick={() => router.push('/businesses')}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex flex-col items-start truncate">
                            <span className="text-xs font-medium text-foreground truncate">
                                {selectedBusiness?.name || 'Select Business'}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
                                {selectedShop?.name || 'Select Shop'}
                            </span>
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                {navigationGroups.map((group) => {
                    const filteredItems = group.items.filter(item => {
                        if (item.name === 'catalog') {
                            return !selectedShop?.shop_type || selectedShop?.shop_type === 'product' || selectedShop?.shop_type === 'both';
                        }
                        if (item.name === 'services') {
                            return selectedShop?.shop_type === 'service' || selectedShop?.shop_type === 'both';
                        }
                        return true;
                    });

                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={group.group}>
                            <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t(group.group.toLowerCase()) || group.group}
                            </h3>
                            <div className="space-y-1">
                                {filteredItems.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={mobile ? onClose : undefined}
                                            className={cn(
                                                "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                                                isActive
                                                    ? "text-primary bg-primary/10"
                                                    : "text-muted-foreground hover:text-primary hover:bg-muted"
                                            )}
                                        >
                                            <div className="flex items-center">
                                                <item.icon className={cn("w-5 h-5 mr-3 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                                                {t(item.name)}
                                            </div>
                                            {/* Badge for new orders */}
                                            {item.name === 'new_orders' && newOrdersCount > 0 && (
                                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                                                    {newOrdersCount}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
                <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                >
                    {t('logout')}
                </button>
            </div>
        </div>
    );
}
