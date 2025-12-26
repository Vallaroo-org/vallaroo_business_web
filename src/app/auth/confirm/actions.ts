'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function verifyRecoveryToken(formData: FormData) {
    const email = formData.get('email') as string
    const token = formData.get('token') as string

    if (!email || !token) {
        return { error: 'Missing email or token' }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
    })

    if (error) {
        redirect(`/auth/confirm?token=${token}&email=${email}&error=${encodeURIComponent(error.message)}`)
    }

    // Redirect to update password page explicitly
    redirect('/auth/update-password')
}
