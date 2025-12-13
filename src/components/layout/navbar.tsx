'use client';

import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import LanguageSwitcher from '@/components/ui/language-switcher';

interface NavbarProps {
    onMenuClick?: () => void;
    showMenuButton?: boolean;
}

export function Navbar({ onMenuClick, showMenuButton = true }: NavbarProps) {
    return (
        <div className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-200">
            <div className="flex items-center gap-4">
                {showMenuButton && (
                    <button
                        onClick={onMenuClick}
                        className="p-2 text-muted-foreground rounded-md hover:bg-muted lg:hidden"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                )}

            </div>

            <div className="flex items-center gap-3 ml-auto">
                <LanguageSwitcher />
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-muted-foreground hover:bg-muted">
                    <Bell className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
