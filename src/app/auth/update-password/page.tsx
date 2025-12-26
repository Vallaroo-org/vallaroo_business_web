
import { updatePassword } from '../../login/actions'
import { AlertCircle } from 'lucide-react'

export default async function UpdatePasswordPage({
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
                    <h2 className="text-2xl font-bold text-gray-900 font-display">Update your password</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Enter your new password below.
                    </p>
                </div>

                <form action={updatePassword} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={8}
                            className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
                            placeholder="••••••••"
                        />
                    </div>

                    {params.error && (
                        <div className="rounded-lg bg-red-50 p-3 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <p className="text-sm text-red-700">{params.error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-lg bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition-all duration-200"
                    >
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    )
}
