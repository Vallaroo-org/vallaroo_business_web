'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in a real app, you might want to validate the inputs
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const next = (formData.get('next') as string) || '/'

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect(`/login?error=Invalid credentials&next=${encodeURIComponent(next)}&email=${encodeURIComponent(email)}`)
    }

    revalidatePath('/', 'layout')
    redirect(next)
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const next = (formData.get('next') as string) || '/'

    if (!password || password.length < 8) {
        redirect(`/signup?error=Password must be at least 8 characters&next=${encodeURIComponent(next)}`)
    }

    // Check if user exists to provide better feedback (requires service role)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const adminClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Check user_profiles as a proxy for existing users
        // Note: This assumes email is synced to user_profiles
        const { data: existingProfile } = await adminClient
            .from('user_profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        if (existingProfile) {
            redirect(`/signup?error=Email already registered&next=${encodeURIComponent(next)}`)
        }
    }

    // Simple signup - in real app would likely need more profile info
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`
        }
    })

    if (error) {
        // User already registered error might be caught here if enumeration protection is OFF
        // or other errors like rate limit, etc.
        // Redirect back to signup page instead of login page
        redirect(`/signup?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`)
    }

    revalidatePath('/', 'layout')
    redirect(`/login?verification_sent=true&next=${encodeURIComponent(next)}`)
}

export async function signInWithGoogle(formData: FormData) {
    const supabase = await createClient()
    const next = (formData.get('next') as string) || '/'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
        },
    })

    if (error) {
        redirect(`/login?error=Could not initiate Google Login&next=${encodeURIComponent(next)}`)
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/update-password`,
    })

    if (error) {
        redirect('/forgot-password?error=Could not send reset password email')
    }

    redirect('/forgot-password?message=Check your email for the reset link')
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || password.length < 8) {
        redirect('/auth/update-password?error=Password must be at least 8 characters')
    }

    if (password !== confirmPassword) {
        redirect('/auth/update-password?error=Passwords do not match')
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        redirect('/auth/update-password?error=Could not update password')
    }

    redirect('/login?message=Password updated successfully')
}
