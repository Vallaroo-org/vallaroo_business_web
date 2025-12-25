
import { resetPassword } from '../login/actions'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { parseError } from '@/lib/utils'

export default async function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const params = await searchParams;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center mb-8">
                    <img
                        src="/vallaroo_business_light_mode.png"
                        alt="Vallaroo"
                        className="h-12 w-auto"
                    />
                </div>
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 font-display">Reset your password</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form action={resetPassword} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email address <span className="text-red-600">*</span>
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
                            placeholder="name@company.com"
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
                        type="submit"
                        className="flex w-full justify-center rounded-lg bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition-all duration-200"
                    >
                        Send reset link
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        Remember your password?{' '}
                        <a href="/login" className="font-semibold text-emerald-900 hover:underline">
                            Back to sign in
                        </a>
                    </p>
                </form>
            </div>
        </div>
    )
}
