'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function ShopCategoriesPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Shop Categories</h1>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-200">Centrally Managed</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Shop categories are now managed by Vallaroo Admins to ensure consistency across the platform.
                        You cannot add or edit categories here.
                    </p>
                </div>
            </div>
        </div>
    );
}
