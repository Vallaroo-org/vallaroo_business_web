import { login, signInWithGoogle } from './actions'
import { Store, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { parseError } from '@/lib/utils'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string; verification_sent?: string; next?: string; email?: string }>
}) {
    const params = await searchParams;
    const next = params.next || '/';

    if (params.verification_sent) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
                <div className="w-full max-w-sm text-center animate-in fade-in zoom-in duration-300">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-6">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display tracking-tight">Check your inbox</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        We've sent a magic link to your email. Click it to verify your account and get started.
                    </p>
                    <a
                        href="/login"
                        className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all duration-200"
                    >
                        Back to Sign in
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Panel - Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative p-12">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {/* Brand Logo */}
                    <div className="flex items-center justify-center mb-12">
                        <img
                            src="/vallaroo_business_light_mode.png"
                            alt="Vallaroo"
                            className="h-14 w-auto"
                        />
                    </div>

                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-display">Welcome back</h2>
                        <p className="mt-2 text-base text-gray-500">
                            Please enter your details to sign in.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <form className="space-y-5">
                            <input type="hidden" name="next" value={next} />

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
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full rounded-md border-0 py-3.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 bg-white !bg-white [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] transition-all duration-200 ease-in-out"
                                    placeholder="••••••••"
                                />
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

                            <button
                                formAction={login}
                                className="flex w-full justify-center items-center rounded-lg bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition-all duration-200"
                            >
                                Sign in
                            </button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm font-medium leading-6">
                                <span className="bg-white px-4 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <form action={signInWithGoogle}>
                            <input type="hidden" name="next" value={next} />
                            <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Google
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500">
                            Don't have an account?{' '}
                            <a href="/signup" className="font-semibold text-emerald-900 hover:underline">
                                Create free account
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Visual */}
            <div className="hidden lg:flex w-1/2 bg-emerald-950 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-800/40 via-emerald-950 to-emerald-950 z-0" />

                {/* Decorative blurred blobs */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl md:text-6xl font-display font-medium text-white leading-tight mb-8">
                        Enter <br />
                        the Future <br />
                        <span className="text-emerald-400">of Business,</span> <br />
                        today
                    </h1>

                    {/* Mockup Card */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full max-w-sm ml-auto transform translate-y-8 rotate-[-5deg] shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <Store className="h-8 w-8 text-white/80" />
                        </div>
                        <div className="space-y-2 mb-8">
                            <div className="text-3xl font-bold text-white tracking-tighter">$12,347.23</div>
                            <div className="text-sm text-white/50">Combined Balance</div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="text-white/80">Primary Business</div>
                            <div className="font-mono text-white/90">**** 4829</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
