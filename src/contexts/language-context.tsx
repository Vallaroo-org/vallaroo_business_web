'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// For now, we will use simple object maps for translation strings
// In a real app, these would come from separate JSON files or a library like next-intl
const en: Record<string, string> = {
    'dashboard': 'Dashboard',
    'new_bill': 'New Bill',
    'orders': 'Online Orders',
    'bill_history': 'Bill History',
    'catalog': 'Catalog',
    'customers': 'Customers',
    'reports': 'Reports',
    'settings': 'Settings',
    'logout': 'Log Out',
    'search': 'Search',
    'notifications': 'Notifications',
    'total_revenue': 'Total Revenue',
    'products': 'Products',
    'recent_activity': 'Recent Activity',
    'no_recent_activity': 'No recent activity found.',
    'from_last_month': 'from last month',
    'new_orders': 'New Orders',
    'order_history': 'Order History',
    'services': 'Services',
    'overview': 'Overview',
    'sales': 'Sales',
    'management': 'Management',
    'analytics': 'Analytics',
    'system': 'System',
};

const ml: Record<string, string> = {
    'dashboard': 'ഡാഷ്ബോർഡ്',
    'new_bill': 'പുതിയ ബിൽ',
    'orders': 'ഓൺലൈൻ ഓർഡറുകൾ',
    'bill_history': 'ബിൽ ചരിത്രം',
    'catalog': 'കാറ്റലോഗ്',
    'customers': 'ഉപഭോക്താക്കൾ',
    'reports': 'റിപ്പോർട്ടുകൾ',
    'settings': 'ക്രമീകരണങ്ങൾ',
    'logout': 'പുറത്തുകടക്കുക',
    'search': 'തിരയുക',
    'notifications': 'അറിയിപ്പുകൾ',
    'total_revenue': 'ആകെ വരുമാനം',
    'products': 'ഉൽപ്പന്നങ്ങൾ',
    'recent_activity': 'സമീപകാല പ്രവർത്തനങ്ങൾ',
    'no_recent_activity': 'സമീപകാല പ്രവർത്തനങ്ങളൊന്നും കണ്ടെത്തിയില്ല.',
    'from_last_month': 'കഴിഞ്ഞ മാസത്തെ അപേക്ഷിച്ച്',
};

type Locale = 'en' | 'ml';
// type Translations = typeof en; // Unused

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    getLocalized: (data: Record<string, any>, field: string) => string; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en');

    useEffect(() => {
        // Load saved locale
        const saved = localStorage.getItem('vallaroo_locale') as Locale;
        if (saved && (saved === 'en' || saved === 'ml')) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setLocaleState(saved);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem('vallaroo_locale', newLocale);
    };

    const t = (key: string, params?: Record<string, string | number>) => {
        const translations = locale === 'ml' ? ml : en;
        let text = translations[key] || en[key] || key;

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, String(v));
            });
        }
        return text;
    };

    const getLocalized = (data: any, field: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!data) return '';
        if (locale === 'ml') {
            const mlValue = data[`${field}_ml`];
            if (mlValue) return mlValue;
        }
        return data[field] || '';
    };

    // The Provider must be rendered even during SSR so children can access context
    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, getLocalized }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
