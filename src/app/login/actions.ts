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

    // Simple signup - in real app would likely need more profile info
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`
        }
    })

    if (error) {
        redirect(`/login?error=Could not sign up&next=${encodeURIComponent(next)}`)
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
