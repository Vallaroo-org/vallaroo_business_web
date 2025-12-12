'use client';

import { useLanguage } from '@/contexts/language-context';

export default function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    return (
        <div className="flex items-center">
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-full p-1 flex items-center border border-gray-200 dark:border-zinc-700">
                <button
                    onClick={() => setLocale('en')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${locale === 'en'
                        ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white'
                        }`}
                >
                    EN
                </button>
                <button
                    onClick={() => setLocale('ml')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${locale === 'ml'
                        ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white'
                        }`}
                >
                    മലയാളം
                </button>
            </div>
        </div>
    );
}
