'use client';

import Link from 'next/link';
import { CreditCard, Store, Users, User, Bell, HelpCircle, Tags } from 'lucide-react';

export default function SettingsPage() {
    const settingsLinks = [
        {
            name: 'Subscription',
            href: '/settings/subscription',
            description: 'Manage your plan and billing details',
            icon: CreditCard
        },
        {
            name: 'Business Profile',
            href: '/settings/business',
            description: 'Update business name, address, and logo',
            icon: Store
        },
        {
            name: 'Shop Profile',
            href: '/settings/shop',
            description: 'Manage currently selected shop settings',
            icon: Store
        },

        {
            name: 'Staff & Permissions',
            href: '/settings/staff',
            description: 'Manage team members and roles',
            icon: Users
        },
        {
            name: 'Account',
            href: '/settings/account',
            description: 'Update your personal profile',
            icon: User
        },
        {
            name: 'Notifications',
            href: '/settings/notifications',
            description: 'Configure email and push notifications',
            icon: Bell
        },
        {
            name: 'Help & Support',
            href: '/settings/help',
            description: 'Contact support and view legal docs',
            icon: HelpCircle
        }, // Added HelperCircle import needed in next step
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {settingsLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className="flex items-start p-6 space-x-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-all border border-border hover:border-primary/50 group"
                    >
                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20 transition-colors">
                            <link.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-foreground">{link.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
