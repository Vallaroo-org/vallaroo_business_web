
import { verifyRecoveryToken } from './actions'

export default async function ConfirmRecoveryPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string; email?: string; error?: string }>
}) {
    const params = await searchParams;
    const token = params.token
    const email = params.email
    const error = params.error

    if (!token || !email) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Invalid Link</h3>
                <p className="mt-2 text-sm text-gray-500 text-center max-w-sm">
                    This password reset link is missing required information. Please request a new one.
                </p>
                <div className="mt-6">
                    <a href="/forgot-password" className="text-sm font-semibold text-emerald-600 hover:text-emerald-500">
                        Request new link &rarr;
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
            <div className="w-full max-w-sm text-center">
                <div className="flex items-center justify-center mb-8">
                    <img
                        src="/vallaroo_business_light_mode.png"
                        alt="Vallaroo"
                        className="h-12 w-auto"
                    />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 font-display mb-2">Reset Password</h2>
                <p className="text-sm text-gray-500 mb-8">
                    Click the button below to verify your email and set a new password.
                </p>

                {error && (
                    <div className="mb-6 rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form action={verifyRecoveryToken}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="email" value={email} />
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition-all duration-200"
                    >
                        Proceed to Reset Password
                    </button>
                </form>
            </div>
        </div>
    )
}
