'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';
import { BusinessProvider } from '@/components/providers/business-provider';

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <BusinessProvider>
            <div className="flex min-h-screen bg-background">
                {/* Mobile sidebar backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Mobile Sidebar */}
                <div className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-background transform transition-transform duration-200 ease-in-out lg:hidden border-r border-border",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <Sidebar mobile onClose={() => setSidebarOpen(false)} />
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden lg:flex w-72 flex-col fixed inset-y-0 z-30">
                    <Sidebar />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen lg:ml-72 transition-all duration-200">
                    <Navbar onMenuClick={() => setSidebarOpen(true)} />

                    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto w-full max-w-4xl">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </BusinessProvider>
    );
}
