'use client';

import { useState } from 'react';
import { login } from './actions';
import { CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { parseError } from '@/lib/utils';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex w-full justify-center items-center rounded-lg bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? 'Signing in...' : 'Sign in'}
        </button>
    );
}

export function LoginForm({ params }: { params: { message?: string; error?: string; email?: string; next?: string } }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form action={login} className="space-y-5">
            <input type="hidden" name="next" value={params.next || '/'} />

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-600">*</span>
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    defaultValue={typeof params.email === 'string' ? params.email : ''}
                    className="block w-full rounded-md border-0 py-3.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 bg-white !bg-white [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] transition-all duration-200 ease-in-out"
                    placeholder="name@company.com"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password <span className="text-red-600">*</span>
                    </label>
                    <a href="/forgot-password" className="text-sm font-semibold text-gray-900 hover:text-gray-700">
                        Forgot?
                    </a>
                </div>
                <div className="relative">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        className="block w-full rounded-md border-0 py-3.5 pl-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 bg-white !bg-white [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] transition-all duration-200 ease-in-out"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                        ) : (
                            <Eye className="h-5 w-5" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>

            {params.error && (
                <div className="rounded-lg bg-red-50 p-3 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">{parseError(params.error)}</p>
                </div>
            )}

            {params.message && (
                <div className="rounded-lg bg-green-50 p-3 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <p className="text-sm text-green-700">{params.message}</p>
                </div>
            )}

            <SubmitButton />
        </form>
    );
}
